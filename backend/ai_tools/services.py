import re

from cvs.services import SKILL_ALIASES, extract_skills


def _skill_is_essential(job_text, skill):
    """
    Détermine si une compétence est essentielle à partir de son
    contexte dans l'offre.

    Une compétence est essentielle lorsqu'elle apparaît :
    - avec un marqueur d'exigence forte ;
    - dans une mission/action explicitement demandée.

    Une compétence présentée comme bonus reste complémentaire.
    """
    if not job_text:
        return False

    strong_markers = [
        "requis",
        "requise",
        "requises",
        "obligatoire",
        "obligatoires",
        "indispensable",
        "indispensables",
        "exigé",
        "exigée",
        "exigées",
        "maîtrise",
        "maitrise",
        "maîtriser",
        "maitriser",
        "bonne connaissance",
        "bonnes connaissances",
        "solide connaissance",
        "solides connaissances",
        "connaissances en",
        "connaissance en",
        "expérience avec",
        "expérience en",
    ]

    bonus_markers = [
        "un plus",
        "serait un plus",
        "constitue un plus",
        "constituent un plus",
        "apprécié",
        "appréciée",
        "appréciées",
        "souhaité",
        "souhaitée",
        "bonus",
    ]

    mission_verbs = [
        "automatiser",
        "rédiger",
        "extraire",
        "analyser",
        "interroger",
        "manipuler",
        "réaliser",
        "concevoir",
        "maintenir",
        "développer",
        "paramétrer",
        "créer",
        "produire",
        "construire",
        "mettre en place",
        "utiliser",
        "exploiter",
    ]

    aliases = SKILL_ALIASES.get(skill, [skill])

    sentences = re.split(
        r"(?<=[.!?;])\s+|\n+",
        job_text,
    )

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        skill_present = any(
            re.search(
                rf"(?<!\w){re.escape(alias)}(?!\w)",
                sentence,
                re.IGNORECASE,
            )
            for alias in aliases
        )

        if not skill_present:
            continue

        sentence_lower = sentence.lower()

        # Un bonus explicite ne doit jamais devenir essentiel.
        if any(
            marker in sentence_lower
            for marker in bonus_markers
        ):
            continue

        if any(
            marker in sentence_lower
            for marker in strong_markers
        ):
            return True

        if any(
            re.search(
                rf"\b{re.escape(verb)}\b",
                sentence_lower,
            )
            for verb in mission_verbs
        ):
            return True

    return False


def classify_job_skills(job_text, job_skills):
    """
    Classe les compétences explicitement présentes dans l'offre.

    essential :
        l'offre contient un marqueur d'exigence forte à proximité.

    complementary :
        la compétence est présente, mais aucune exigence forte
        explicite n'a été détectée.
    """
    essential = []
    complementary = []

    for skill in job_skills:
        if _skill_is_essential(job_text, skill):
            essential.append(skill)
        else:
            complementary.append(skill)

    return {
        "essential": essential,
        "complementary": complementary,
    }


def calculate_skill_score(
    resume_skills,
    job_skills,
    essential_skills=None,
):
    """
    Calcule le score technique.

    Une compétence essentielle vaut 2 points.
    Une compétence complémentaire vaut 1 point.

    Sans classification fournie, le comportement historique est
    conservé : toutes les compétences valent 1 point.
    """
    resume_set = {
        skill.lower()
        for skill in resume_skills
    }

    essential_set = {
        skill.lower()
        for skill in (essential_skills or [])
    }

    matching_skills = []
    missing_skills = []

    if not job_skills:
        return None, matching_skills, missing_skills

    earned_points = 0
    total_points = 0

    for skill in job_skills:
        weight = (
            2
            if skill.lower() in essential_set
            else 1
        )

        total_points += weight

        if skill.lower() in resume_set:
            matching_skills.append(skill)
            earned_points += weight
        else:
            missing_skills.append(skill)

    score = round(
        earned_points / total_points * 100,
        2,
    )

    return score, matching_skills, missing_skills


def calculate_experience_score(resume, job):
    resume_text = (
        f"{resume.experience}\n"
        f"{resume.extracted_text}"
    ).lower()

    job_text = (
        f"{job.title}\n"
        f"{job.description}"
    ).lower()

    experience_dimensions = {
        "data": [
            "data",
            "données",
            "donnée",
        ],
        "analysis": [
            "analyse",
            "analyser",
            "analyst",
            "analytique",
        ],
        "data_quality": [
            "qualité des données",
            "contrôle qualité",
            "validation",
            "fiabilisation",
            "nettoyage",
            "normalisation",
        ],
        "databases": [
            "base de données",
            "bases de données",
            "sql",
        ],
        "programming": [
            "python",
            "programmation",
            "développement",
        ],
        "visualization": [
            "visualisation",
            "tableau de bord",
            "dashboard",
            "power bi",
        ],
        "collection": [
            "collecte",
            "collecter",
            "intégration",
        ],
    }

    required_dimensions = []

    for dimension, keywords in experience_dimensions.items():
        if any(
            keyword in job_text
            for keyword in keywords
        ):
            required_dimensions.append(
                (dimension, keywords)
            )

    if not required_dimensions:
        return None

    matched_dimensions = []

    for dimension, keywords in required_dimensions:
        if any(
            keyword in resume_text
            for keyword in keywords
        ):
            matched_dimensions.append(dimension)

    score = (
        len(matched_dimensions)
        / len(required_dimensions)
        * 100
    )

    return round(score, 2)

def calculate_education_score(resume, job):
    education_text = resume.education.lower()
    job_text = job.description.lower()

    education_requirements = [
        "bac+3",
        "bac +3",
        "bac+4",
        "bac +4",
        "bac+5",
        "bac +5",
        "licence",
        "master",
        "miage",
        "école d'ingénieur",
        "école d’ingénieur",
        "diplôme d'ingénieur",
        "diplôme d’ingénieur",
    ]

    required = [
        requirement
        for requirement in education_requirements
        if requirement in job_text
    ]

    # Si l'offre ne précise aucun niveau de formation,
    # ce critère n'est pas évalué.
    if not required:
        return None

    matched = [
        requirement
        for requirement in required
        if requirement in education_text
    ]

    return round(
        len(matched) / len(required) * 100,
        2,
    )



def calculate_scoring_summary(scores):
    """
    Calcule un score de compatibilité pondéré sur 100.

    Une dimension non évaluable ne reçoit aucun point et son poids
    n'est pas redistribué aux autres dimensions.

    coverage_score indique la proportion du modèle qui a réellement
    pu être évaluée.
    """
    weights = {
        "skill_score": 0.60,
        "experience_score": 0.25,
        "education_score": 0.15,
    }

    available = {
        key: value
        for key, value in scores.items()
        if value is not None
    }

    coverage_score = round(
        sum(weights[key] for key in available) * 100,
        2,
    )

    overall_score = round(
        sum(
            value * weights[key]
            for key, value in available.items()
        ),
        2,
    )

    if coverage_score >= 80:
        confidence_level = "high"
    elif coverage_score >= 50:
        confidence_level = "medium"
    else:
        confidence_level = "low"

    return {
        "overall_score": overall_score,
        "coverage_score": coverage_score,
        "confidence_level": confidence_level,
    }

def calculate_overall_score(scores):
    weights = {
        "skill_score": 0.60,
        "experience_score": 0.25,
        "education_score": 0.15,
    }

    available = {
        key: value
        for key, value in scores.items()
        if value is not None
    }

    if not available:
        return 0

    total_weight = sum(
        weights[key]
        for key in available
    )

    weighted_score = sum(
        available[key] * weights[key]
        for key in available
    )

    return round(
        weighted_score / total_weight,
        2,
    )


def generate_recommendations(result):
    strengths = []
    improvements = []
    recommendations = []

    matching_skills = result["matching_skills"]
    missing_skills = result["missing_skills"]

    # Points forts liés aux compétences.
    if matching_skills:
        strengths.append(
            "Le CV possède plusieurs compétences techniques "
            "recherchées : "
            + ", ".join(matching_skills)
            + "."
        )

    # Analyse de l'expérience.
    experience_score = result["experience_score"]

    if experience_score is not None:
        if experience_score >= 75:
            strengths.append(
                "L'expérience du candidat présente une forte "
                "correspondance avec les besoins de l'offre."
            )

        elif experience_score < 50:
            improvements.append(
                "L'expérience présentée correspond encore peu "
                "aux éléments recherchés dans l'offre."
            )

    # Compétences non détectées.
    if missing_skills:
        improvements.append(
            "Compétences recherchées non détectées dans le CV : "
            + ", ".join(missing_skills)
            + "."
        )

        recommendations.append(
            "Si elles sont réellement maîtrisées, ajouter ou mieux "
            "mettre en évidence ces compétences dans le CV : "
            + ", ".join(missing_skills)
            + "."
       )

    # Formation non précisée dans l'offre.
    if result["education_score"] is None:
        recommendations.append(
            "Le niveau de formation n'est pas suffisamment précisé "
            "dans l'offre pour être évalué automatiquement."
        )

    # Recommandation sur les compétences.
    skill_score = result["skill_score"]

    if skill_score is not None and skill_score < 80:
        recommendations.append(
            "Adapter la section compétences du CV aux technologies "
            "et outils explicitement demandés dans l'offre."
        )

    return {
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
    }


def match_resume_to_job(resume, job):
    resume_skills = extract_skills(
        resume.extracted_text
    )

    job_text = (
        f"{job.title}\n{job.description}"
    )

    job_skills = extract_skills(
        job_text
    )

    skill_classification = classify_job_skills(
        job_text,
        job_skills,
    )

    essential_skills = skill_classification[
        "essential"
    ]

    complementary_skills = skill_classification[
        "complementary"
    ]

    skill_score, matching_skills, missing_skills = (
        calculate_skill_score(
            resume_skills,
            job_skills,
            essential_skills=essential_skills,
        )
    )

    experience_score = calculate_experience_score(
        resume,
        job,
    )

    education_score = calculate_education_score(
        resume,
        job,
    )

    scores = {
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
    }

    scoring = calculate_scoring_summary(
        scores
    )

    result = {
        "overall_score": scoring["overall_score"],
        "coverage_score": scoring["coverage_score"],
        "confidence_level": scoring["confidence_level"],
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "essential_skills": essential_skills,
        "complementary_skills": complementary_skills,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
    }

    analysis = generate_recommendations(
        result
    )

    result.update(analysis)

    return result

def build_skills_gap(resume, jobs):
    """
    Analyse les compétences demandées dans plusieurs offres
    par rapport à un CV.

    Aucun appel IA : utilise le moteur local extract_skills().
    """
    resume_skills = extract_skills(
        resume.extracted_text
    )

    resume_skills_lower = {
        skill.lower()
        for skill in resume_skills
    }

    skills = {}

    for job in jobs:
        job_skills = extract_skills(
            f"{job.title}\n{job.description}"
        )

        # Une compétence n'est comptée qu'une fois par offre.
        for skill in dict.fromkeys(job_skills):
            key = skill.lower()

            if key not in skills:
                skills[key] = {
                    "skill": skill,
                    "job_count": 0,
                    "job_ids": [],
                    "companies": [],
                    "mastered": key in resume_skills_lower,
                }

            skills[key]["job_count"] += 1
            skills[key]["job_ids"].append(job.id)

            if (
                job.company
                and job.company
                not in skills[key]["companies"]
            ):
                skills[key]["companies"].append(
                    job.company
                )

    total_jobs = len(jobs)

    result = []

    for item in skills.values():
        frequency = (
            round(
                item["job_count"] / total_jobs * 100,
                1,
            )
            if total_jobs
            else 0
        )

        if item["mastered"]:
            priority = "mastered"
        elif frequency >= 60:
            priority = "high"
        elif frequency >= 30:
            priority = "medium"
        else:
            priority = "low"

        result.append(
            {
                **item,
                "frequency": frequency,
                "priority": priority,
            }
        )

    result.sort(
        key=lambda item: (
            item["mastered"],
            -item["job_count"],
            item["skill"].lower(),
        )
    )

    missing = [
        item
        for item in result
        if not item["mastered"]
    ]

    mastered = [
        item
        for item in result
        if item["mastered"]
    ]

    return {
        "resume": {
            "id": resume.id,
            "title": resume.title,
        },
        "total_jobs": total_jobs,
        "total_skills": len(result),
        "mastered_count": len(mastered),
        "missing_count": len(missing),
        "coverage": (
            round(
                len(mastered) / len(result) * 100,
                1,
            )
            if result
            else 0
        ),
        "skills": result,
        "priority_skills": missing[:5],
    }
