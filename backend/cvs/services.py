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
