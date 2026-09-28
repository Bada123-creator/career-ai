import os

import requests
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env", override=True)


class JobSearchError(Exception):
    pass


def search_jobs(query, location="", page=1, results_per_page=10):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise JobSearchError(
            "Les identifiants Adzuna sont introuvables."
        )

    query = (query or "").strip()
    location = (location or "").strip()

    if not query:
        raise JobSearchError(
            "Le poste recherché est obligatoire."
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

    url = (
        "https://api.adzuna.com/v1/api/jobs/"
        f"fr/search/{page}"
    )

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": query,
        "results_per_page": results_per_page,
        "content-type": "application/json",
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
            }
        )

    return {
        "count": data.get("count", len(jobs)),
        "page": page,
        "results": jobs,
    }
