import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


MAX_RESPONSE_BYTES = 2_000_000
MAX_REDIRECTS = 5
TIMEOUT = 10

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0 Safari/537.36"
)


class JobImportError(Exception):
    pass


def validate_public_url(url: str) -> str:
    if not isinstance(url, str) or not url.strip():
        raise JobImportError("URL manquante.")

    url = url.strip()

    try:
        parsed = urlparse(url)
    except ValueError as exc:
        raise JobImportError("URL invalide.") from exc

    if parsed.scheme not in {"http", "https"}:
        raise JobImportError(
            "Seules les URLs HTTP et HTTPS sont autorisées."
        )

    if not parsed.hostname:
        raise JobImportError("Nom de domaine invalide.")

    hostname = parsed.hostname.lower().rstrip(".")

    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise JobImportError(
            "Les adresses locales ne sont pas autorisées."
        )

    try:
        addresses = socket.getaddrinfo(
            hostname,
            parsed.port,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise JobImportError(
            "Impossible de résoudre ce nom de domaine."
        ) from exc

    if not addresses:
        raise JobImportError(
            "Impossible de résoudre ce nom de domaine."
        )

    for address in addresses:
        ip_text = address[4][0]

        try:
            ip = ipaddress.ip_address(ip_text)
        except ValueError as exc:
            raise JobImportError(
                "Adresse réseau invalide."
            ) from exc

        if not ip.is_global:
            raise JobImportError(
                "Cette destination réseau n'est pas autorisée."
            )

    return url


def fetch_public_html(url: str) -> tuple[str, str]:
    current_url = validate_public_url(url)

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": (
            "text/html,application/xhtml+xml,"
            "application/xml;q=0.9,*/*;q=0.8"
        ),
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }

    session = requests.Session()

    for _ in range(MAX_REDIRECTS + 1):
        try:
            response = session.get(
                current_url,
                headers=headers,
                timeout=TIMEOUT,
                allow_redirects=False,
                stream=True,
            )
        except requests.RequestException as exc:
            raise JobImportError(
                "Impossible de récupérer cette page."
            ) from exc

        if 300 <= response.status_code < 400:
            location = response.headers.get("Location")

            if not location:
                response.close()
                raise JobImportError(
                    "Redirection invalide."
                )

            next_url = urljoin(
                current_url,
                location,
            )

            response.close()
            current_url = validate_public_url(next_url)
            continue

        if response.status_code >= 400:
            status_code = response.status_code
            response.close()

            raise JobImportError(
                f"Le site a refusé l'accès "
                f"(HTTP {status_code})."
            )

        content_type = (
            response.headers
            .get("Content-Type", "")
            .lower()
        )

        if (
            "text/html" not in content_type
            and "application/xhtml+xml" not in content_type
        ):
            response.close()

            raise JobImportError(
                "Cette URL ne pointe pas vers une page HTML."
            )

        content = bytearray()

        try:
            for chunk in response.iter_content(
                chunk_size=65536
            ):
                if not chunk:
                    continue

                content.extend(chunk)

                if len(content) > MAX_RESPONSE_BYTES:
                    raise JobImportError(
                        "La page est trop volumineuse."
                    )
        finally:
            response.close()

        encoding = (
            response.encoding
            or response.apparent_encoding
            or "utf-8"
        )

        html = bytes(content).decode(
            encoding,
            errors="replace",
        )

        return html, current_url

    raise JobImportError(
        "Trop de redirections."
    )


def extract_job_page_text(url: str) -> dict:
    html, final_url = fetch_public_html(url)

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    for element in soup(
        [
            "script",
            "style",
            "noscript",
            "svg",
            "iframe",
        ]
    ):
        element.decompose()

    page_title = ""

    if soup.title:
        page_title = soup.title.get_text(
            " ",
            strip=True,
        )

    description = ""

    meta_description = soup.find(
        "meta",
        attrs={"name": "description"},
    )

    if (
        meta_description
        and meta_description.get("content")
    ):
        description = meta_description[
            "content"
        ].strip()

    text = soup.get_text(
        "\n",
        strip=True,
    )

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    clean_text = "\n".join(lines)

    # Limite raisonnable pour la future analyse IA.
    clean_text = clean_text[:50_000]

    if len(clean_text) < 100:
        raise JobImportError(
            "Le contenu de cette page est insuffisant "
            "pour extraire une offre."
        )

    return {
        "source_url": final_url,
        "page_title": page_title,
        "meta_description": description,
        "text": clean_text,
    }
