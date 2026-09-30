import re


SKILL_ALIASES = {
    # Data
    "Python": ["Python"],
    "SQL": ["SQL"],
    "Excel": ["Excel"],
    "Pandas": ["Pandas"],
    "NumPy": ["NumPy", "Numpy"],
    "Power BI": ["Power BI", "PowerBI"],
    "Tableau": ["Tableau"],
    "PostgreSQL": [
        "PostgreSQL",
        "Postgres",
        "Postgre SQL",
    ],
    "MySQL": ["MySQL"],
    "MongoDB": ["MongoDB", "Mongo DB"],
    "ETL": ["ETL"],
    "Apache Spark": [
        "Apache Spark",
        "Spark",
        "PySpark",
    ],
    "Airflow": [
        "Airflow",
        "Apache Airflow",
    ],
    "SAS": ["SAS"],
    "VBA": ["VBA", "Visual Basic for Applications"],
    "Power Query": ["Power Query"],
    "DAX": ["DAX"],
    "Talend": ["Talend"],
    "Snowflake": ["Snowflake"],
    "dbt": ["dbt"],
    "BigQuery": [
        "BigQuery",
        "Google BigQuery",
        "Google Big Query",
    ],
    "Looker": ["Looker"],
    "Qlik": [
        "Qlik",
        "QlikView",
        "Qlik Sense",
        "QlikSense",
    ],
    "Databricks": ["Databricks"],
    "Kafka": [
        "Kafka",
        "Apache Kafka",
    ],
    "Hadoop": [
        "Hadoop",
        "Apache Hadoop",
    ],
    "Oracle": [
        "Oracle",
        "Oracle Database",
    ],
    "SQL Server": [
        "SQL Server",
        "Microsoft SQL Server",
        "MSSQL",
    ],
    "SQLite": ["SQLite"],

    # Backend / Web
    "Django": ["Django"],
    "Django REST Framework": [
        "Django REST Framework",
        "Django REST framework",
        "DRF",
    ],
    "API REST": [
        "API REST",
        "REST API",
        "RESTful API",
        "API RESTful",
    ],
    "JavaScript": [
        "JavaScript",
        "Javascript",
        "JS",
    ],
    "TypeScript": [
        "TypeScript",
        "Typescript",
        "TS",
    ],
    "React": ["React", "React.js", "ReactJS"],
    "Next.js": ["Next.js", "NextJS"],
    "PHP": ["PHP"],
    "HTML": ["HTML", "HTML5"],
    "CSS": ["CSS", "CSS3"],
    "Bootstrap": ["Bootstrap"],
    "AJAX": ["AJAX"],

    # Langages
    "Java": ["Java"],
    "C++": ["C++"],
    "C": ["C"],

    # DevOps / Cloud
    "Git": ["Git"],
    "GitHub": ["GitHub"],
    "GitLab": ["GitLab"],
    "Docker": ["Docker"],
    "CMake": ["CMake"],
    "Linux": ["Linux"],
    "CI/CD": [
        "CI/CD",
        "CI-CD",
        "Continuous Integration",
        "Continuous Delivery",
        "Continuous Deployment",
    ],
    "AWS": [
        "AWS",
        "Amazon Web Services",
    ],
    "Azure": [
        "Azure",
        "Microsoft Azure",
    ],
    "GCP": [
        "GCP",
        "Google Cloud",
        "Google Cloud Platform",
    ],

    # IA / Machine Learning
    "Machine Learning": [
        "Machine Learning",
        "ML",
        "apprentissage automatique",
    ],
    "Deep Learning": [
        "Deep Learning",
        "apprentissage profond",
    ],
    "Scikit-learn": [
        "Scikit-learn",
        "Scikit learn",
        "sklearn",
    ],
    "TensorFlow": [
        "TensorFlow",
        "Tensor Flow",
    ],
    "PyTorch": [
        "PyTorch",
        "Pytorch",
    ],
    "NLP": [
        "NLP",
        "Natural Language Processing",
        "traitement du langage naturel",
    ],
    "LLM": [
        "LLM",
        "Large Language Model",
        "Large Language Models",
    ],
    "IA générative": [
        "IA générative",
        "Intelligence artificielle générative",
        "Generative AI",
        "GenAI",
    ],

    # Data visualisation / graphes
    "Gephi": ["Gephi"],
    "Graphviz": ["Graphviz"],
}


# Compatibilité avec le reste du projet.
KNOWN_SKILLS = list(SKILL_ALIASES.keys())


def _alias_pattern(alias):
    """
    Construit une regex qui exige des limites propres autour
    d'un alias afin d'éviter les correspondances partielles.
    """
    return rf"(?<!\w){re.escape(alias)}(?!\w)"


def extract_skills(text):
    """
    Détecte les compétences dans un texte et renvoie toujours
    leurs noms canoniques, sans doublons.
    """
    if not text:
        return []

    detected_skills = []

    for canonical_name, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = _alias_pattern(alias)

            # "C" est une compétence particulière :
            # une recherche insensible à la casse provoquerait
            # trop de faux positifs dans du texte français.
            flags = (
                0
                if canonical_name == "C"
                else re.IGNORECASE
            )

            if re.search(
                pattern,
                text,
                flags,
            ):
                detected_skills.append(canonical_name)
                break

    return detected_skills


def extract_education(text):
    if not text:
        return []

    education_keywords = [
        "licence",
        "master",
        "bachelor",
        "baccalauréat",
        "université",
        "école",
        "diplôme",
        "miage",
    ]

    exclusion_markers = [
        "je recherche",
        "recherche une alternance",
        "recherche un stage",
        "objectif professionnel",
    ]

    results = []

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        normalized = line.lower()

        if any(
            marker in normalized
            for marker in exclusion_markers
        ):
            continue

        if any(
            keyword in normalized
            for keyword in education_keywords
        ):
            results.append(line)

    return results


def extract_experience(text):
    """
    Extrait les expériences professionnelles et leurs missions.

    Une expérience commence lorsqu'une ligne contient un intitulé
    professionnel reconnu. Les lignes suivantes sont conservées
    comme missions jusqu'au prochain bloc daté.

    Les projets académiques/personnels ne sont pas absorbés.
    """
    import re

    if not text:
        return []

    professional_roles = [
        r"\bstagiaire\b",
        r"\bemploy[eé]e?\b",
        r"\bagent\b",
        r"\bapprenti(?:e)?s?\b",
        r"\bd[eé]veloppeur(?:se)?\b",
        r"\bdata\s+analyst\b",
        r"\bdata\s+engineer\b",
    ]

    exclusion_markers = [
        "je recherche",
        "recherche une alternance",
        "recherche un stage",
        "admission conditionnée",
        "contrat d'apprentissage",
        "cycle ingénieur",
    ]

    # Détecte le début d'un nouveau bloc chronologique.
    date_markers = [
        r"\b(?:janv|f[eé]v|mars|avr|mai|juin|juil|ao[uû]t|sept|oct|nov|d[eé]c)\.?\b",
        r"\bdepuis\b",
        r"\b20\d{2}\b",
    ]

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    results = []
    collecting = False

    def is_professional_start(line):
        normalized = line.lower()

        if any(
            marker in normalized
            for marker in exclusion_markers
        ):
            return False

        return any(
            re.search(pattern, normalized)
            for pattern in professional_roles
        )

    def looks_like_new_dated_block(line):
        normalized = line.lower()

        return any(
            re.search(pattern, normalized)
            for pattern in date_markers
        )

    for line in lines:
        if is_professional_start(line):
            collecting = True
            results.append(line)
            continue

        if collecting and looks_like_new_dated_block(line):
            # Un nouveau bloc daté qui n'est pas reconnu comme
            # expérience professionnelle marque la fin de la section
            # d'expérience actuellement collectée.
            collecting = False

        if collecting:
            results.append(line)

    return results
