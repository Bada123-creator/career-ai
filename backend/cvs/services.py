import re


KNOWN_SKILLS = [
    "Python",
    "SQL",
    "Excel",
    "Power BI",
    "Django",
    "Django REST Framework",
    "DRF",
    "Java",
    "C++",
    "C",
    "JavaScript",
    "PHP",
    "HTML",
    "CSS",
    "Bootstrap",
    "AJAX",
    "MySQL",
    "Git",
    "GitHub",
    "Docker",
    "CMake",
    "Linux",
    "Gephi",
    "Graphviz",
    "API REST",
]


def extract_skills(text):
    detected_skills = []

    for skill in KNOWN_SKILLS:
        pattern = rf"(?<!\w){re.escape(skill)}(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            detected_skills.append(skill)

    return detected_skills


def extract_education(text):
    education_keywords = [
        "Licence",
        "Master",
        "Bachelor",
        "Baccalauréat",
        "Université",
        "École",
        "Diplôme",
    ]

    results = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        if any(
            keyword.lower() in line.lower()
            for keyword in education_keywords
        ):
            results.append(line)

    return results


def extract_experience(text):
    experience_keywords = [
        "Stagiaire",
        "Stage",
        "Employé",
        "Agent",
        "Alternance",
        "Apprenti",
        "Développeur",
        "Data Analyst",
        "Data Engineer",
    ]

    results = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        if any(
            keyword.lower() in line.lower()
            for keyword in experience_keywords
        ):
            results.append(line)

    return results
