import os

import requests
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env", override=True)


class JobSearchError(Exception):
    pass


CONTRACT_QUERIES = {
    "alternance": "alternance",
    "stage": "stage",
    "cdi": "CDI",
    "cdd": "CDD",
}


def detect_contract_type(title="", description=""):
    """
    Détecte le type de contrat à partir du titre et
    de la description fournis par la source externe.

    Retourne :
    alternance, stage, cdi, cdd ou unknown.
    """
    text = f"{title} {description}".lower()

    contract_patterns = {
        "alternance": (
            "alternance",
            "alternant",
            "alternante",
            "apprentissage",
            "apprenti",
            "apprentie",
            "contrat pro",
            "contrat de professionnalisation",
        ),
        "stage": (
            "stage",
            "stagiaire",
            "internship",
        ),
        "cdi": (
            " cdi ",
            "contrat à durée indéterminée",
            "contrat a duree indeterminee",
        ),
        "cdd": (
            " cdd ",
            "contrat à durée déterminée",
            "contrat a duree determinee",
        ),
    }

    normalized_text = f" {text} "

    for contract_type, patterns in contract_patterns.items():
        if any(
            pattern in normalized_text
            for pattern in patterns
        ):
            return contract_type

    return "unknown"


def search_jobs(
    query,
    location="",
    page=1,
    results_per_page=10,
    contract_type="",
    sort_by="date",
):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise JobSearchError(
            "Les identifiants Adzuna sont introuvables."
        )

    query = (query or "").strip()
    location = (location or "").strip()
    contract_type = (contract_type or "").strip().lower()
    sort_by = (sort_by or "date").strip().lower()

    if not query:
        raise JobSearchError(
            "Le poste recherché est obligatoire."
        )

    if contract_type and contract_type not in CONTRACT_QUERIES:
        raise JobSearchError(
            "Type de contrat invalide."
        )

    if sort_by not in {"date", "relevance"}:
        raise JobSearchError(
            "Type de tri invalide."
        )

    try:
        page = max(1, int(page))
        results_per_page = min(
            max(1, int(results_per_page)),
            20,
        )
    except (TypeError, ValueError):
        raise JobSearchError(
            "Paramètres de pagination invalides."
        )

    search_query = query

    if contract_type:
        search_query = (
            f"{query} {CONTRACT_QUERIES[contract_type]}"
        )

    url = (
        "https://api.adzuna.com/v1/api/jobs/"
        f"fr/search/{page}"
    )

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": search_query,
        "results_per_page": results_per_page,
        "content-type": "application/json",
        "sort_by": sort_by,
    }

    if location:
        params["where"] = location

    try:
        response = requests.get(
            url,
            params=params,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException as exc:
        raise JobSearchError(
            "Impossible de contacter le service "
            "de recherche d'offres."
        ) from exc

    except ValueError as exc:
        raise JobSearchError(
            "La réponse du service d'offres est invalide."
        ) from exc

    jobs = []

    for item in data.get("results", []):
        company = item.get("company") or {}
        location_data = item.get("location") or {}

        jobs.append(
            {
                "external_id": str(
                    item.get("id", "")
                ),
                "title": item.get("title", ""),
                "company": company.get(
                    "display_name",
                    "",
                ),
                "location": location_data.get(
                    "display_name",
                    "",
                ),
                "description": item.get(
                    "description",
                    "",
                ),
                "source_url": item.get(
                    "redirect_url",
                    "",
                ),
                "created": item.get(
                    "created",
                    "",
                ),
                "contract_type_detected": (
                    detect_contract_type(
                        item.get("title", ""),
                        item.get("description", ""),
                    )
                ),
            }
        )

    return {
        "count": data.get("count", len(jobs)),
        "page": page,
        "contract_type": contract_type,
        "sort_by": sort_by,
        "results": jobs,
    }
