from .job_import_service import (
    JobImportError,
    extract_job_page_text,
)


MIN_COMPLETE_DESCRIPTION_LENGTH = 1200


def enrich_job_description(
    description: str | None,
    source_url: str | None,
) -> dict:
    """
    Enrichit une description courte depuis la page source.

    Le service reste volontairement prudent :
    - une description déjà suffisamment longue est conservée ;
    - sans URL, la description existante est conservée ;
    - si la récupération échoue, aucun contenu n'est inventé ;
    - la nouvelle description n'est utilisée que si elle apporte
      réellement plus d'information.
    """

    original_description = (
        description
        if isinstance(description, str)
        else ""
    )

    normalized_description = original_description.strip()

    source_url = (
        source_url.strip()
        if isinstance(source_url, str)
        else ""
    )

    if (
        len(normalized_description)
        >= MIN_COMPLETE_DESCRIPTION_LENGTH
    ):
        return {
            "description": original_description,
            "enriched": False,
            "source": "existing",
            "source_url": source_url,
        }

    if not source_url:
        return {
            "description": original_description,
            "enriched": False,
            "source": "fallback",
            "source_url": "",
        }

    try:
        page = extract_job_page_text(source_url)
    except JobImportError:
        return {
            "description": original_description,
            "enriched": False,
            "source": "fallback",
            "source_url": source_url,
        }

    page_text = (
        page.get("text", "").strip()
        if isinstance(page, dict)
        else ""
    )

    final_url = (
        page.get("source_url", source_url)
        if isinstance(page, dict)
        else source_url
    )

    # On ne remplace jamais une description existante
    # par un contenu moins informatif.
    if len(page_text) <= len(original_description):
        return {
            "description": original_description,
            "enriched": False,
            "source": "fallback",
            "source_url": final_url,
        }

    return {
        "description": page_text,
        "enriched": True,
        "source": "page",
        "source_url": final_url,
    }
