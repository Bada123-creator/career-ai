import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv(dotenv_path=".env", override=True)


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY est introuvable dans le fichier .env."
        )

    return OpenAI(api_key=api_key)


AI_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
        },
        "strengths": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "weaknesses": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "recommendations": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "relevant_experience": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "relevant_education": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "summary",
        "strengths",
        "weaknesses",
        "recommendations",
        "relevant_experience",
        "relevant_education",
    ],
    "additionalProperties": False,
}


def analyze_resume_with_ai(resume, job):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    prompt = f"""
Tu es le moteur d'analyse de candidatures de CareerAI.

Analyse le CV du candidat par rapport à l'offre d'emploi.

RÈGLES :
- Base-toi uniquement sur le CV et l'offre.
- N'invente aucune compétence, expérience ou formation.
- Une compétence absente du CV doit être décrite comme
  "non détectée dans le CV".
- Ne conclus jamais qu'une compétence non mentionnée
  n'est pas maîtrisée.
- Ne recommande pas automatiquement une formation pour
  une compétence simplement absente du CV.
- Si une compétence demandée n'est pas détectée,
  recommande d'abord de l'ajouter ou de la mettre en
  évidence si elle est réellement maîtrisée.
- Analyse les compétences techniques, l'expérience,
  la formation et la pertinence du profil.
- Les recommandations doivent être concrètes et
  directement utiles pour améliorer la candidature.

CV :
----------------
{resume.extracted_text}
----------------

OFFRE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_resume_analysis",
                "strict": True,
                "schema": AI_ANALYSIS_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune analyse."
        )

    return json.loads(response.output_text)


COVER_LETTER_SCHEMA = {
    "type": "object",
    "properties": {
        "content": {
            "type": "string",
        },
    },
    "required": ["content"],
    "additionalProperties": False,
}


def get_candidate_profile_context(user):
    """
    Retourne le contexte déclaré par l'utilisateur dans son profil CareerAI.

    Ce contexte peut guider la personnalisation des contenus générés,
    mais ne remplace jamais le CV comme source de vérité concernant
    les compétences, expériences, formations et projets.
    """
    try:
        profile = user.profile
    except Exception:
        return {
            "target_role": "",
            "bio": "",
            "city": "",
            "phone": "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
        }

    return {
        "target_role": profile.target_role or "",
        "bio": profile.bio or "",
        "city": profile.city or "",
        "phone": profile.phone or "",
        "linkedin_url": profile.linkedin_url or "",
        "github_url": profile.github_url or "",
        "portfolio_url": profile.portfolio_url or "",
    }


def generate_cover_letter_with_ai(analysis):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    resume = analysis.resume
    job = analysis.job
    profile_context = get_candidate_profile_context(
        analysis.user
    )

    prompt = f"""
Tu es le moteur de génération de lettres de motivation
de CareerAI.

Rédige une lettre de motivation professionnelle en français
pour le candidat, adaptée précisément à l'offre fournie.

OBJECTIF :
La lettre doit montrer pourquoi les expériences, projets,
compétences et formations réellement présents dans le CV
sont pertinents pour les besoins décrits dans l'offre.

RÈGLES ABSOLUES DE FIABILITÉ :
- Base-toi uniquement sur les informations présentes dans
  le CV et dans l'offre.
- N'invente aucune compétence, expérience, formation,
  certification, établissement, projet ou résultat.
- N'invente aucune information personnelle.
- N'invente aucune qualité personnelle ou comportementale.
- Des termes comme "rigoureux", "curieux", "autonome",
  "passionné", "dynamique", "organisé" ou similaires ne
  peuvent être attribués au candidat que s'ils sont
  explicitement justifiés par le CV.
- Une compétence non présente dans le CV ne doit jamais être
  présentée comme maîtrisée.
- Ne transforme jamais une absence d'information en fait.

FIDÉLITÉ AU CV :
- Respecte exactement les noms propres présents dans le CV.
- Respecte exactement les noms des projets, entreprises,
  établissements, formations et technologies.
- Ne modifie pas leur orthographe ou leur graphie.
- Par exemple, si un projet est nommé "CareerAI", ne le
  transforme pas en "Career-AI", "Career AI" ou autre variante.
- N'invente pas de responsabilité ou de résultat qui ne soit
  pas explicitement soutenu par le CV.
- Ne présente pas une technologie simplement citée comme une
  expertise avancée sans preuve dans le CV.

TEMPORALITÉ :
- Respecte strictement la temporalité des informations du CV.
- Ne présente jamais une formation, une école, une entreprise
  ou une situation comme actuelle uniquement parce qu'elle
  apparaît dans le CV.
- Si le CV ne permet pas de déterminer avec certitude qu'une
  formation ou une situation est actuellement en cours,
  utilise une formulation neutre ou omets cette information.
- Ne transforme jamais une admission, une candidature,
  un projet futur ou une formation envisagée en inscription
  actuelle.
- Une admission future ou conditionnelle ne doit être
  mentionnée que si elle est clairement pertinente pour
  l'offre.
- Si elle est mentionnée, conserve explicitement son caractère
  futur ou conditionnel.
- Une admission ou formation future ne doit pas devenir
  l'argument principal de la lettre lorsque des expériences,
  compétences ou projets plus directement liés au poste sont
  disponibles.

PERTINENCE :
- Priorise les expériences et projets ayant le lien le plus
  direct avec les missions de l'offre.
- Utilise des exemples concrets présents dans le CV pour
  justifier les compétences mises en avant.
- Fais le lien entre ces éléments et les besoins de
  l'entreprise sans inventer de résultat.
- Évite d'énumérer toutes les technologies du CV.
- Ne conserve que celles qui apportent réellement quelque
  chose pour cette candidature.
- Ne répète pas inutilement les mêmes informations.

STYLE :
- Le texte doit être naturel, précis, crédible et personnalisé.
- Évite les phrases génériques qui pourraient être utilisées
  pour n'importe quel candidat ou n'importe quelle entreprise.
- Évite les formulations exagérées.
- N'affirme pas connaître la culture, les valeurs, les projets
  internes ou les ambitions de l'entreprise si l'offre ne les
  mentionne pas.
- Privilégie les preuves concrètes aux adjectifs valorisants.
- La lettre doit rester concise et agréable à lire.
- Utilise des paragraphes clairement séparés.
- Vérifie soigneusement les espaces, la ponctuation,
  les apostrophes et les paragraphes.
- Ne colle jamais deux mots qui doivent être séparés.

RÈGLES CAREERAI :
- Ne mentionne pas les scores de compatibilité CareerAI.
- Ne parle pas de "compétences manquantes".
- Ne dis pas que le candidat utilise CareerAI.
- Les éléments détectés par CareerAI ci-dessous sont seulement
  des aides de contexte : ils ne remplacent jamais le CV comme
  source de vérité.
- En cas de contradiction entre un élément CareerAI et le CV,
  le CV est prioritaire.

PROFIL CAREERAI :
- Le profil ci-dessous contient des informations déclarées par
  l'utilisateur.
- Tu peux utiliser le métier cible et la présentation pour mieux
  comprendre son objectif professionnel et personnaliser la lettre.
- Le profil ne constitue PAS une preuve de compétence, d'expérience,
  de formation, de projet, de certification ou de résultat.
- Toute affirmation concernant le parcours ou les compétences doit
  rester justifiable par le CV.
- La ville et les liens professionnels sont uniquement du contexte.
- N'insère pas automatiquement le téléphone, la ville ou les URL
  dans le corps de la lettre.
- Si le profil contredit le CV sur le parcours professionnel ou
  académique, le CV reste prioritaire.

PROFIL DÉCLARÉ PAR L'UTILISATEUR :
----------------
Métier cible : {profile_context["target_role"]}
Présentation : {profile_context["bio"]}
Ville : {profile_context["city"]}
LinkedIn : {profile_context["linkedin_url"]}
GitHub : {profile_context["github_url"]}
Portfolio : {profile_context["portfolio_url"]}
----------------

FORMAT :
- Commence directement par "Madame, Monsieur,"
- Termine par une formule de politesse professionnelle.
- Ne crée pas d'adresse postale.
- Ne crée pas de numéro de téléphone.
- Ne crée pas de nom de recruteur.
- Ne crée pas de date.
- Ne mets pas d'objet.
- Ne mets pas d'en-tête.
- Ne crée pas de signature.
- Retourne uniquement le contenu de la lettre.

CV :
----------------
{resume.extracted_text}
----------------

OFFRE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------

ÉLÉMENTS DÉJÀ DÉTECTÉS PAR CAREERAI :

Compétences correspondantes :
{analysis.matching_skills}

Analyse sémantique :
{analysis.ai_analysis}
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_cover_letter",
                "strict": True,
                "schema": COVER_LETTER_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune lettre de motivation."
        )

    data = json.loads(response.output_text)

    content = data.get("content", "").strip()

    if not content:
        raise ValueError(
            "La lettre de motivation générée est vide."
        )

    return content


INTERVIEW_PREPARATION_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "hr",
                            "technical",
                            "cv",
                            "situational",
                        ],
                    },
                    "question": {
                        "type": "string",
                    },
                    "suggested_answer": {
                        "type": "string",
                    },
                    "tips": {
                        "type": "array",
                        "items": {
                            "type": "string",
                        },
                    },
                },
                "required": [
                    "type",
                    "question",
                    "suggested_answer",
                    "tips",
                ],
                "additionalProperties": False,
            },
        },
        "general_advice": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "questions",
        "general_advice",
    ],
    "additionalProperties": False,
}


def generate_interview_preparation_with_ai(analysis):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    resume = analysis.resume
    job = analysis.job

    prompt = f"""
Tu es le moteur de préparation aux entretiens de CareerAI.

Prépare le candidat à un entretien pour l'offre fournie.

OBJECTIF :
Génère exactement 12 questions d'entretien pertinentes et
personnalisées, accompagnées de propositions de réponses et
de conseils pratiques.

RÉPARTITION DES 12 QUESTIONS :
- 3 questions RH de type "hr"
- 4 questions techniques de type "technical"
- 3 questions directement liées au CV de type "cv"
- 2 questions situationnelles de type "situational"

RÈGLES SUR LES QUESTIONS :
- Les questions doivent être adaptées au poste et à l'offre.
- Les questions techniques peuvent porter sur des compétences
  demandées par l'offre même si elles ne sont pas présentes
  dans le CV.
- Les questions liées au CV doivent s'appuyer sur des
  expériences, formations ou projets réellement présents.
- Évite les doublons et les questions trop génériques.
- Formule les questions comme pourrait le faire un recruteur.

RÈGLES SUR LES RÉPONSES :
- Les propositions de réponses doivent être rédigées à la
  première personne afin que le candidat puisse s'en inspirer.
- La réponse proposée doit pouvoir être prononcée naturellement
  à voix haute pendant un véritable entretien.
- Ne parle jamais du CV comme d'un document dans la réponse.
- N'utilise jamais des formulations comme "mon CV indique",
  "mon CV ne précise pas", "ce n'est pas documenté dans mon CV"
  ou "sur la base des éléments présentés".
- Si une compétence demandée n'est pas établie par le CV,
  formule une réponse naturelle et honnête, par exemple en
  expliquant que le candidat n'a pas encore eu l'occasion de
  l'utiliser suffisamment, sans inventer son niveau réel.
- La réponse proposée doit pouvoir être prononcée naturellement
  à voix haute pendant un véritable entretien.
- Ne parle jamais du CV comme d'un document dans la réponse.
- N'utilise jamais des formulations comme "mon CV indique",
  "mon CV ne précise pas", "ce n'est pas documenté dans mon CV"
  ou "sur la base des éléments présentés".
- Si une compétence demandée n'est pas établie par le CV,
  formule une réponse naturelle et honnête, par exemple en
  expliquant que le candidat n'a pas encore eu l'occasion de
  l'utiliser suffisamment, sans inventer son niveau réel.
- Base les réponses uniquement sur les informations réellement
  présentes dans le CV.
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucune formation.
- N'invente aucun projet.
- N'invente aucun résultat chiffré.
- N'invente aucune responsabilité.
- N'invente aucune qualité personnelle.
- Respecte strictement la temporalité du CV.
- Ne transforme jamais une admission, une candidature ou un
  projet futur en situation actuelle.
- Respecte exactement les noms propres, projets,
  établissements et technologies présents dans le CV.
- Si une question porte sur une technologie ou une compétence
  demandée par l'offre mais non détectée dans le CV, ne
  prétends jamais que le candidat la maîtrise.
- Dans ce cas, propose une réponse honnête expliquant que cette
  compétence n'est pas suffisamment documentée dans le CV et
  suggère comment relier la réponse à une compétence ou une
  expérience réellement présente, lorsque c'est possible.
- Une information absente du CV ne doit jamais devenir un fait.

RÈGLES SUR LES CONSEILS :
- Chaque question doit avoir 2 ou 3 conseils courts et
  concrets.
- Les conseils peuvent expliquer la structure d'une bonne
  réponse, les éléments à mettre en avant ou les erreurs à
  éviter.
- Les conseils ne doivent pas inventer d'informations sur le
  candidat.
- Les conseils situationnels peuvent recommander une structure
  comme STAR lorsque cela est pertinent.

CONSEILS GÉNÉRAUX :
- Fournis entre 4 et 6 conseils généraux.
- Ils doivent être adaptés au poste et à l'entretien.
- Ne prétends pas connaître le processus de recrutement de
  l'entreprise si l'offre ne le précise pas.

RÈGLES CAREERAI :
- Ne mentionne pas les scores de compatibilité.
- Ne dis pas que le candidat utilise CareerAI.
- Ne présente pas les compétences non détectées comme des
  compétences que le candidat ne possède pas.
- Les informations CareerAI fournies ci-dessous servent
  uniquement de contexte.
- Le CV reste la source de vérité sur le candidat.
- En cas de contradiction, privilégie toujours le CV.

CV :
----------------
{resume.extracted_text}
----------------

OFFRE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------

CONTEXTE DE L'ANALYSE :

Compétences détectées :
{analysis.matching_skills}

Compétences demandées mais non détectées dans le CV :
{analysis.missing_skills}

Analyse sémantique :
{analysis.ai_analysis}
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_interview_preparation",
                "strict": True,
                "schema": INTERVIEW_PREPARATION_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune préparation d'entretien."
        )

    data = json.loads(response.output_text)

    questions = data.get("questions", [])
    general_advice = data.get(
        "general_advice",
        [],
    )

    if len(questions) != 12:
        raise ValueError(
            "La préparation doit contenir exactement 12 questions."
        )

    return {
        "questions": questions,
        "general_advice": general_advice,
    }


INTERVIEW_ANSWER_FEEDBACK_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
        },
        "strengths": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "improvements": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "improved_answer": {
            "type": "string",
        },
        "delivery_tips": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "score",
        "strengths",
        "improvements",
        "improved_answer",
        "delivery_tips",
    ],
    "additionalProperties": False,
}


def evaluate_interview_answer_with_ai(
    preparation,
    question_index,
    answer,
):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    analysis = preparation.analysis
    resume = analysis.resume
    job = analysis.job

    questions = preparation.questions

    if (
        not isinstance(question_index, int)
        or question_index < 0
        or question_index >= len(questions)
    ):
        raise ValueError(
            "Indice de question invalide."
        )

    if not isinstance(answer, str) or not answer.strip():
        raise ValueError(
            "La réponse du candidat est vide."
        )

    question_data = questions[question_index]

    question = question_data.get(
        "question",
        "",
    )

    question_type = question_data.get(
        "type",
        "",
    )

    suggested_answer = question_data.get(
        "suggested_answer",
        "",
    )

    prompt = f"""
Tu es l'évaluateur d'entretien de CareerAI.

Tu dois analyser la réponse réellement donnée par un candidat
à une question d'entretien.

QUESTION :
----------------
{question}
----------------

TYPE DE QUESTION :
{question_type}

RÉPONSE DU CANDIDAT :
----------------
{answer.strip()}
----------------

OBJECTIF :
Évalue la qualité de cette réponse dans le contexte précis du
poste, de l'offre et du parcours réel du candidat.

ÉVALUATION :
Attribue un score entier entre 0 et 100.

Le score doit refléter principalement :
- la pertinence par rapport à la question ;
- la précision et le niveau de concret ;
- la structure et la clarté ;
- l'utilisation pertinente d'éléments réels du parcours ;
- l'adéquation avec le poste lorsqu'elle est pertinente.

Le score ne doit pas mesurer la valeur personnelle du candidat.
Il mesure uniquement la qualité de cette réponse à cette
question précise.

RÈGLES DE FIABILITÉ :
- Le CV est la source de vérité sur le parcours du candidat.
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucune formation.
- N'invente aucun projet.
- N'invente aucune responsabilité.
- N'invente aucun résultat chiffré.
- N'invente aucune qualité personnelle.
- N'invente aucune maîtrise technique.
- Une information absente du CV ne doit jamais devenir un fait.
- Respecte strictement la temporalité des informations.
- Respecte exactement les noms des projets, entreprises,
  établissements et technologies lorsqu'ils sont utilisés.
- Ne sanctionne pas automatiquement le candidat simplement
  parce qu'une compétence demandée par l'offre n'apparaît pas
  dans le CV.
- Si le candidat affirme dans sa réponse une information qui
  n'est pas établie par le CV, ne la valide pas comme un fait.
- Tu peux signaler avec tact qu'une affirmation gagnerait à
  être étayée ou précisée.

POINTS FORTS :
- Fournis entre 1 et 4 points forts lorsque la réponse contient
  réellement des éléments positifs.
- Sois précis et directement lié à la réponse donnée.
- Ne félicite pas artificiellement une réponse faible ou vide.

POINTS À AMÉLIORER :
- Fournis entre 1 et 4 améliorations concrètes.
- Explique ce qui rendrait la réponse plus pertinente, claire,
  précise ou convaincante.
- Ne demande jamais au candidat d'inventer une expérience ou
  un résultat.

RÉPONSE AMÉLIORÉE :
- Réécris une meilleure version de la réponse à la première
  personne.
- Elle doit pouvoir être prononcée naturellement à voix haute.
- Conserve uniquement les faits réellement établis par le CV
  ou déjà présents dans la réponse lorsqu'ils sont compatibles
  avec le CV.
- Tu peux améliorer la structure, la formulation, la précision
  et l'ordre des idées.
- Tu ne peux pas fabriquer de nouveaux faits pour rendre la
  réponse plus impressionnante.
- Ne parle jamais du CV comme d'un document.
- N'utilise pas des formulations telles que "mon CV indique",
  "mon CV ne précise pas" ou "ce n'est pas documenté dans mon
  CV".
- Si les informations disponibles ne permettent pas une
  réponse très détaillée, produis une réponse honnête et
  concise plutôt que d'inventer.

CONSEILS DE PRÉSENTATION :
- Fournis entre 1 et 3 conseils pratiques pour l'oral.
- Ils peuvent concerner la concision, la structure, le niveau
  de détail ou la façon de présenter l'exemple.
- Ne prétends pas pouvoir observer la voix, le regard, le
  rythme ou le langage corporel du candidat : tu ne disposes
  que du texte de sa réponse.

RÈGLES CAREERAI :
- Ne mentionne pas CareerAI dans le feedback.
- Ne mentionne pas les scores de compatibilité de l'analyse.
- N'évalue pas le candidat dans son ensemble.
- Évalue uniquement la réponse fournie.
- Le modèle de réponse préparé ci-dessous sert uniquement de
  contexte. Ne pénalise pas le candidat parce que sa réponse
  est différente.
- Ne copie pas mécaniquement ce modèle.

MODÈLE DE RÉPONSE PRÉPARÉ :
----------------
{suggested_answer}
----------------

CV DU CANDIDAT :
----------------
{resume.extracted_text}
----------------

OFFRE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_interview_answer_feedback",
                "strict": True,
                "schema": INTERVIEW_ANSWER_FEEDBACK_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucun feedback d'entretien."
        )

    data = json.loads(response.output_text)

    score = data.get("score")

    if (
        not isinstance(score, int)
        or score < 0
        or score > 100
    ):
        raise ValueError(
            "Le score retourné par l'IA est invalide."
        )

    return data




INTERVIEW_FINAL_REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
        },
        "recurring_strengths": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "priority_improvements": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "skills_to_highlight": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "final_recommendations": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "summary",
        "recurring_strengths",
        "priority_improvements",
        "skills_to_highlight",
        "final_recommendations",
    ],
    "additionalProperties": False,
}


def generate_interview_report_with_ai(preparation):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    analysis = preparation.analysis
    resume = analysis.resume
    job = analysis.job

    answers = list(
        preparation.answers
        .filter(feedback__isnull=False)
        .order_by("question_index")
    )

    total_questions = len(preparation.questions or [])

    if total_questions == 0:
        raise ValueError(
            "Cette préparation ne contient aucune question."
        )

    if len(answers) != total_questions:
        raise ValueError(
            "Toutes les questions doivent être analysées "
            "avant de générer le bilan final."
        )

    scores = []

    interview_data = []

    for interview_answer in answers:
        feedback = interview_answer.feedback or {}
        score = feedback.get("score")

        if (
            not isinstance(score, (int, float))
            or isinstance(score, bool)
            or score < 0
            or score > 100
        ):
            raise ValueError(
                "Une réponse possède un score invalide."
            )

        scores.append(float(score))

        interview_data.append(
            {
                "question_number":
                    interview_answer.question_index + 1,
                "question_type":
                    interview_answer.question_type,
                "question":
                    interview_answer.question,
                "candidate_answer":
                    interview_answer.answer,
                "feedback":
                    feedback,
            }
        )

    average_score = round(
        sum(scores) / len(scores),
        1,
    )

    interview_json = json.dumps(
        interview_data,
        ensure_ascii=False,
        indent=2,
    )

    prompt = f"""
Tu es le moteur de bilan final d'entretien de CareerAI.

Tu dois produire une synthèse globale d'une simulation
d'entretien terminée.

Le candidat a répondu à toutes les questions.
Chaque réponse a déjà été évaluée individuellement.

IMPORTANT :
Le score moyen est calculé par l'application et non par toi.
Le score moyen calculé est : {average_score}/100.

Tu ne dois ni recalculer, ni modifier, ni interpréter ce
score comme une mesure de la valeur personnelle du candidat.

OBJECTIF :
Analyse transversalement l'ensemble de l'entretien afin
d'identifier :
- les points forts réellement récurrents ;
- les améliorations prioritaires ;
- les éléments réels du parcours qui pourraient être mieux
  valorisés ;
- des recommandations concrètes avant un véritable
  entretien.

RÈGLES ABSOLUES DE FIABILITÉ :
- Le CV est la source de vérité sur le parcours.
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucune formation.
- N'invente aucun projet.
- N'invente aucune responsabilité.
- N'invente aucun résultat chiffré.
- N'invente aucune certification.
- N'invente aucune qualité personnelle.
- N'invente aucun niveau de maîtrise technique.
- Respecte la temporalité des informations.
- Respecte les noms exacts des entreprises, projets,
  établissements et technologies.
- Une information absente du CV ne doit pas devenir un fait.
- Une affirmation présente uniquement dans une réponse du
  candidat mais non établie par le CV ne doit pas être
  validée comme un fait sur son parcours.
- Tu peux toutefois conseiller au candidat de préciser ou
  d'étayer une affirmation lorsque cela est pertinent.

SYNTHÈSE :
- Fais une synthèse professionnelle, concise et utile.
- Analyse la qualité globale des réponses.
- Ne juge pas la valeur personnelle du candidat.
- Ne présente pas le score moyen comme une probabilité
  d'embauche.

POINTS FORTS RÉCURRENTS :
- Ne retiens que les forces réellement observables dans
  plusieurs réponses ou clairement confirmées par les
  évaluations.
- Évite les compliments génériques.

AMÉLIORATIONS PRIORITAIRES :
- Identifie les problèmes qui reviennent réellement.
- Les recommandations doivent être concrètes.
- Ne recommande jamais d'inventer une expérience ou un
  résultat.

ÉLÉMENTS À MIEUX VALORISER :
- Utilise uniquement des compétences, expériences,
  formations ou projets réellement présents dans le CV.
- Sélectionne surtout ceux qui sont pertinents pour l'offre.
- Ne transforme jamais une compétence absente en compétence
  maîtrisée.

RECOMMANDATIONS FINALES :
- Donne des actions concrètes pour améliorer les futures
  réponses.
- Tu peux conseiller une meilleure structure, davantage
  d'exemples réels, plus de précision ou de concision.
- Ne prétends pas avoir observé la voix, le regard, le
  rythme, la posture ou le langage corporel : tu ne disposes
  que des réponses textuelles.

CV DU CANDIDAT :
----------------
{resume.extracted_text}
----------------

OFFRE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------

ENTRETIEN ET ÉVALUATIONS :
----------------
{interview_json}
----------------
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_interview_final_report",
                "strict": True,
                "schema": INTERVIEW_FINAL_REPORT_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucun bilan final."
        )

    report = json.loads(response.output_text)

    return {
        "average_score": average_score,
        "report": report,
    }


CV_OPTIMIZATION_SCHEMA = {
    "type": "object",
    "properties": {
        "professional_summary": {
            "type": "string",
        },
        "skills_to_highlight": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "experience_rewrites": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "original": {
                        "type": "string",
                    },
                    "optimized": {
                        "type": "string",
                    },
                    "reason": {
                        "type": "string",
                    },
                },
                "required": [
                    "original",
                    "optimized",
                    "reason",
                ],
                "additionalProperties": False,
            },
        },
        "relevant_keywords": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                    },
                    "status": {
                        "type": "string",
                        "enum": [
                            "present",
                            "supported_but_not_explicit",
                            "missing",
                        ],
                    },
                    "recommendation": {
                        "type": "string",
                    },
                },
                "required": [
                    "keyword",
                    "status",
                    "recommendation",
                ],
                "additionalProperties": False,
            },
        },
        "priority_recommendations": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "warnings": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
    },
    "required": [
        "professional_summary",
        "skills_to_highlight",
        "experience_rewrites",
        "relevant_keywords",
        "priority_recommendations",
        "warnings",
    ],
    "additionalProperties": False,
}


def generate_cv_optimization_with_ai(analysis):
    """
    Optimise la présentation d'un CV pour l'offre liée
    à une analyse CareerAI.

    Le CV reste la source de vérité.
    Aucune information nouvelle ne doit être inventée.
    """

    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    resume = analysis.resume
    job = analysis.job

    if not resume.extracted_text.strip():
        raise ValueError(
            "Le CV ne contient aucun texte exploitable."
        )

    if not job.description.strip():
        raise ValueError(
            "L'offre ne contient aucune description exploitable."
        )

    prompt = f"""
Tu es le moteur d'optimisation de CV de CareerAI.

OBJECTIF :
Aider le candidat à mieux adapter la PRESENTATION de son CV
à une offre précise.

Tu ne dois pas créer un faux parcours.
Tu optimises uniquement des informations réellement
soutenues par le CV fourni.

RÈGLES ABSOLUES DE FIABILITÉ :
- Le CV fourni est la source de vérité.
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucune formation.
- N'invente aucun diplôme.
- N'invente aucun projet.
- N'invente aucune certification.
- N'invente aucune responsabilité.
- N'invente aucune technologie utilisée.
- N'invente aucun résultat chiffré.
- N'invente aucune durée.
- N'invente aucun niveau de maîtrise.
- N'invente aucune qualité personnelle.
- Respecte les noms, dates, entreprises, établissements,
  projets et technologies présents dans le CV.
- Une exigence présente dans l'offre mais absente du CV ne
  doit jamais être présentée comme acquise.
- Ne transforme jamais une compétence proche en compétence
  équivalente sans preuve dans le CV.

Tu peux :
- reformuler des informations existantes ;
- rendre une phrase plus claire et professionnelle ;
- mieux mettre en avant une compétence réellement présente ;
- réorganiser les éléments selon leur pertinence pour
  l'offre ;
- identifier des mots-clés de l'offre ;
- signaler qu'un mot-clé est absent ;
- signaler qu'une information du CV pourrait soutenir un
  mot-clé sans que celui-ci soit explicitement écrit.

RÉSUMÉ PROFESSIONNEL :
Rédige un résumé court adapté à l'offre en utilisant
uniquement des faits soutenus par le CV.
Ne présente pas un objectif professionnel comme une
expérience déjà acquise.

COMPÉTENCES À METTRE EN AVANT :
Sélectionne uniquement des compétences réellement présentes
dans le CV et pertinentes pour cette offre.

REFORMULATION DES EXPÉRIENCES :
- "original" doit correspondre à une information réellement
  identifiable dans le CV.
- "optimized" doit conserver exactement le sens factuel.
- Tu peux améliorer le vocabulaire et la lisibilité.
- Tu ne peux ajouter ni résultat, ni technologie, ni mission
  qui ne soit soutenue par le CV.
- "reason" explique brièvement pourquoi la reformulation est
  plus pertinente pour cette offre.

MOTS-CLÉS :
Pour chaque mot-clé important de l'offre, utilise exactement
un des statuts suivants :

"present" :
le mot-clé ou la compétence est explicitement présent dans
le CV.

"supported_but_not_explicit" :
le CV contient une information qui peut raisonnablement
soutenir ce concept, mais le terme exact n'est pas écrit.
Dans ce cas, recommande uniquement une reformulation fidèle.

"missing" :
le CV ne fournit pas de preuve suffisante.
Dans ce cas, ne recommande jamais de l'ajouter comme
compétence acquise.

RECOMMANDATIONS PRIORITAIRES :
Donne des actions concrètes permettant d'améliorer le CV
pour cette offre sans modifier la réalité du parcours.

WARNINGS :
Signale notamment les compétences importantes demandées par
l'offre qui ne sont pas suffisamment soutenues par le CV.

CV DU CANDIDAT :
----------------
{resume.extracted_text}
----------------

OFFRE CIBLÉE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}

Description :
----------------
{job.description}
----------------
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_cv_optimization",
                "strict": True,
                "schema": CV_OPTIMIZATION_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune optimisation de CV."
        )

    return json.loads(response.output_text)


GENERATED_RESUME_SCHEMA = {
    "type": "object",
    "properties": {
        "header": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "headline": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "location": {"type": "string"},
                "linkedin": {"type": "string"},
                "github": {"type": "string"},
                "portfolio": {"type": "string"},
            },
            "required": [
                "name",
                "headline",
                "email",
                "phone",
                "location",
                "linkedin",
                "github",
                "portfolio",
            ],
            "additionalProperties": False,
        },
        "professional_summary": {
            "type": "string",
        },
        "skills": {
            "type": "array",
            "items": {"type": "string"},
        },
        "experiences": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "company": {"type": "string"},
                    "location": {"type": "string"},
                    "dates": {"type": "string"},
                    "bullets": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "title",
                    "company",
                    "location",
                    "dates",
                    "bullets",
                ],
                "additionalProperties": False,
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "degree": {"type": "string"},
                    "institution": {"type": "string"},
                    "location": {"type": "string"},
                    "dates": {"type": "string"},
                    "details": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "degree",
                    "institution",
                    "location",
                    "dates",
                    "details",
                ],
                "additionalProperties": False,
            },
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "technologies": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "description": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "name",
                    "technologies",
                    "description",
                ],
                "additionalProperties": False,
            },
        },
        "languages": {
            "type": "array",
            "items": {"type": "string"},
        },
        "additional_sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "items": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "title",
                    "items",
                ],
                "additionalProperties": False,
            },
        },
    },
    "required": [
        "header",
        "professional_summary",
        "skills",
        "experiences",
        "education",
        "projects",
        "languages",
        "additional_sections",
    ],
    "additionalProperties": False,
}


def generate_optimized_resume_with_ai(
    analysis,
    cv_optimization,
):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    resume = analysis.resume
    job = analysis.job
    profile_context = get_candidate_profile_context(
        analysis.user
    )

    if not resume.extracted_text.strip():
        raise ValueError(
            "Le CV ne contient aucun texte exploitable."
        )

    if not job.description.strip():
        raise ValueError(
            "L'offre ne contient aucune description exploitable."
        )

    optimization = cv_optimization.optimization

    prompt = f"""
Tu es le moteur de génération de CV de CareerAI.

Ta mission est de produire une VERSION STRUCTURÉE ET OPTIMISÉE
du CV du candidat pour l'offre fournie.

SOURCE DE VÉRITÉ ABSOLUE :
le texte du CV original.

RÈGLES IMPÉRATIVES :
- N'invente aucune information.
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucun projet.
- N'invente aucun diplôme ou établissement.
- N'invente aucune certification.
- N'invente aucune technologie.
- N'invente aucune responsabilité.
- N'invente aucun résultat chiffré.
- N'invente aucune durée ou date.
- N'invente aucun niveau de langue.
- N'invente aucune coordonnée.
- N'ajoute jamais un mot-clé de l'offre comme compétence
  s'il n'est pas soutenu par le CV.
- Les éléments marqués "missing" dans l'optimisation
  ne doivent jamais devenir des compétences du candidat.

Tu peux :
- reformuler les informations existantes ;
- améliorer leur clarté ;
- améliorer leur impact professionnel ;
- réorganiser les informations ;
- sélectionner les éléments les plus pertinents ;
- rapprocher le vocabulaire du CV de celui de l'offre
  lorsque le sens reste strictement identique ;
- proposer un titre professionnel cohérent avec le CV
  et l'objectif de candidature.

IMPORTANT :
Si une information nécessaire à un champ n'existe pas
dans le CV, utilise une chaîne vide ou une liste vide.
Ne complète jamais une information par supposition.

Le résumé professionnel doit rester entièrement justifiable
par le CV original.

PROFIL CAREERAI :
- Le profil ci-dessous contient des informations déclarées
  directement par l'utilisateur.
- Le métier cible peut guider le titre professionnel et
  l'orientation générale du résumé.
- La présentation peut aider à comprendre l'objectif du candidat.
- Le profil ne constitue PAS une preuve de compétence,
  d'expérience, de formation, de projet ou de certification.
- N'ajoute jamais une compétence, expérience, formation ou projet
  uniquement parce qu'il est mentionné dans la présentation.
- Toute affirmation sur le parcours doit rester justifiable
  par le CV original.
- Si le profil et le CV se contredisent concernant le parcours,
  le CV original est prioritaire.
- Les coordonnées et liens professionnels peuvent uniquement
  être utilisés dans les champs correspondants lorsqu'ils existent
  dans la structure demandée.
- Ne transforme jamais une coordonnée ou une URL en contenu
  professionnel.

PROFIL DÉCLARÉ PAR L'UTILISATEUR :
----------------
Métier cible : {profile_context["target_role"]}
Présentation : {profile_context["bio"]}
Ville : {profile_context["city"]}
Téléphone : {profile_context["phone"]}
LinkedIn : {profile_context["linkedin_url"]}
GitHub : {profile_context["github_url"]}
Portfolio : {profile_context["portfolio_url"]}
----------------

Les expériences et projets doivent conserver les faits
du CV original. Tu peux reformuler les phrases mais pas
modifier leur sens.

====================
CV ORIGINAL
====================

{resume.extracted_text}

====================
OFFRE
====================

Titre :
{job.title}

Entreprise :
{job.company}

Description :
{job.description}

====================
OPTIMISATION CAREERAI
====================

{json.dumps(
    optimization,
    ensure_ascii=False,
    indent=2,
)}

Retourne uniquement la structure JSON demandée.
"""

    response = client.responses.create(
        model=model,
        reasoning={"effort": "low"},
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_generated_resume",
                "strict": True,
                "schema": GENERATED_RESUME_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucun CV généré."
        )

    return json.loads(response.output_text)


JOB_RECOMMENDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
        },
        "match_level": {
            "type": "string",
            "enum": [
                "strong",
                "good",
                "partial",
                "weak",
            ],
        },
        "summary": {
            "type": "string",
        },
        "matching_skills": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "missing_skills": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "reasons": {
            "type": "array",
            "items": {
                "type": "string",
            },
        },
        "recommendation": {
            "type": "string",
        },
    },
    "required": [
        "score",
        "match_level",
        "summary",
        "matching_skills",
        "missing_skills",
        "reasons",
        "recommendation",
    ],
    "additionalProperties": False,
}


def generate_job_recommendation_with_ai(
    resume,
    job,
    profile_context,
):
    client = get_openai_client()
    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    prompt = f"""
Tu es le moteur de recommandation de CareerAI.

Ta mission est d'évaluer la pertinence d'une offre
pour un candidat à partir de son CV et de son profil.

IMPORTANT :
- N'invente aucune compétence.
- N'invente aucune expérience.
- N'invente aucun diplôme.
- N'invente aucun projet.
- N'invente aucune certification.
- N'invente aucune information sur l'offre.
- Une compétence est "matching" uniquement si elle
  est réellement soutenue par le CV.
- Une compétence demandée par l'offre mais absente
  du CV doit être placée dans "missing_skills".
- Le profil CareerAI indique les objectifs déclarés
  du candidat mais ne constitue pas une preuve
  de compétence ou d'expérience.
- Le CV reste la source principale concernant
  les compétences et le parcours.
- Ne pénalise pas artificiellement une information
  qui n'est simplement pas précisée dans l'offre.

Le score doit mesurer la compatibilité entre :
1. les compétences démontrées dans le CV ;
2. les exigences de l'offre ;
3. l'expérience pertinente ;
4. la formation pertinente ;
5. le métier cible déclaré par le candidat.

Interprétation du niveau :
- strong : très forte correspondance ;
- good : bonne correspondance ;
- partial : correspondance partielle ;
- weak : faible correspondance.

====================
PROFIL CANDIDAT
====================

Métier cible :
{profile_context.get("target_role", "")}

Présentation :
{profile_context.get("bio", "")}

Ville :
{profile_context.get("city", "")}

====================
CV
====================

{resume.extracted_text}

====================
OFFRE
====================

Titre :
{job.title}

Entreprise :
{job.company}

Localisation :
{job.location}

Description :
{job.description}

====================

Retourne uniquement la structure JSON demandée.
"""

    response = client.responses.create(
        model=model,
        reasoning={"effort": "low"},
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_job_recommendation",
                "strict": True,
                "schema": JOB_RECOMMENDATION_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune recommandation."
        )

    return json.loads(response.output_text)


JOB_IMPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
        },
        "company": {
            "type": "string",
        },
        "location": {
            "type": "string",
        },
        "description": {
            "type": "string",
        },
        "is_job_offer": {
            "type": "boolean",
        },
        "confidence": {
            "type": "string",
            "enum": [
                "high",
                "medium",
                "low",
            ],
        },
    },
    "required": [
        "title",
        "company",
        "location",
        "description",
        "is_job_offer",
        "confidence",
    ],
    "additionalProperties": False,
}


def extract_job_from_page_with_ai(
    *,
    page_title,
    meta_description,
    page_text,
    source_url,
):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    prompt = f"""
Tu es le module d'import d'offres de CareerAI.

Ta mission est d'extraire une offre d'emploi à partir
du contenu d'une page web.

RÈGLES IMPORTANTES :
- Utilise uniquement les informations présentes dans la page.
- N'invente jamais une entreprise, un poste, une localisation
  ou une information absente.
- Si une information n'est pas identifiable, retourne "".
- Ne complète pas avec tes connaissances générales.
- Ignore les menus, navigation, publicités, pied de page,
  offres voisines et contenu sans rapport.
- La description doit représenter l'offre elle-même :
  missions, profil, compétences, contexte et conditions
  lorsqu'ils sont réellement présents.
- Ne reproduis pas inutilement les éléments de navigation.
- Si la page n'est pas une offre d'emploi précise,
  is_job_offer doit être false.
- confidence représente la confiance dans l'extraction :
  high, medium ou low.

URL :
{source_url}

Titre HTML :
{page_title}

Meta description :
{meta_description}

CONTENU DE LA PAGE :
{page_text}
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_job_import",
                "strict": True,
                "schema": JOB_IMPORT_SCHEMA,
            }
        },
    )

    return json.loads(response.output_text)


FOLLOW_UP_SCHEMA = {
    "type": "object",
    "properties": {
        "subject": {
            "type": "string",
        },
        "message": {
            "type": "string",
        },
        "tone": {
            "type": "string",
            "enum": ["professional"],
        },
    },
    "required": [
        "subject",
        "message",
        "tone",
    ],
    "additionalProperties": False,
}


def generate_follow_up_with_ai(application):
    client = get_openai_client()

    model = os.getenv(
        "OPENAI_MODEL",
        "gpt-5.6-luna",
    )

    job = application.job
    profile_context = get_candidate_profile_context(
        application.user
    )

    applied_at = (
        application.applied_at.isoformat()
        if application.applied_at
        else "Non renseignée"
    )

    follow_up_at = (
        application.follow_up_at.isoformat()
        if application.follow_up_at
        else "Non renseignée"
    )

    next_action = (
        application.next_action.strip()
        if application.next_action
        else "Non renseignée"
    )

    prompt = f"""
Tu es le moteur de génération de messages de relance
de CareerAI.

Rédige un message professionnel en français permettant au
candidat de relancer l'entreprise au sujet de sa candidature.

OBJECTIF :
Produire une relance courte, naturelle, polie et directement
utilisable par email.

RÈGLES ABSOLUES DE FIABILITÉ :
- Base-toi uniquement sur les informations fournies ci-dessous.
- N'invente aucune réponse de l'entreprise.
- N'invente aucun échange avec un recruteur.
- N'invente aucun entretien, appel ou rendez-vous.
- N'invente aucun nom de recruteur.
- N'invente aucune date.
- N'invente aucune information sur l'entreprise.
- N'invente aucune compétence, expérience, formation,
  certification, projet ou résultat du candidat.
- Ne prétends jamais qu'une information a été communiquée
  au candidat si elle n'apparaît pas dans le contexte.
- Si une information manque, omets-la simplement.

STYLE :
- Français professionnel et naturel.
- Ton courtois, positif et sobre.
- Pas de pression excessive sur le recruteur.
- Pas de formulation culpabilisante.
- Pas de flatterie artificielle.
- Pas de texte générique inutile.
- Message relativement court.
- Paragraphes clairement séparés.
- Vérifie soigneusement les espaces, la ponctuation,
  les apostrophes et la typographie française.
- Ne colle jamais deux mots, une préposition et une date,
  ou deux éléments qui doivent être séparés par un espace.
- Relis le message avant de le retourner afin qu'il soit
  directement utilisable sans correction typographique.
- Ne crée pas de coordonnées.
- Ne crée pas de signature avec un nom si le nom n'est pas
  fourni dans le contexte.
- Ne crée pas d'adresse postale.

OBJET :
- Crée un objet d'email court et professionnel.
- L'objet peut mentionner le poste et le suivi de candidature.
- Ne crée aucun numéro de référence absent du contexte.

PROFIL CAREERAI :
Le profil contient uniquement des informations déclarées
par l'utilisateur.
Il peut aider à comprendre son objectif professionnel mais
ne constitue pas une preuve de compétence ou d'expérience.

Métier cible : {profile_context["target_role"]}
Présentation : {profile_context["bio"]}
Ville : {profile_context["city"]}

CANDIDATURE :
Entreprise : {job.company}
Poste : {job.title}
Localisation : {job.location}
Statut : {application.get_status_display()}
Date de candidature : {applied_at}
Date de relance prévue : {follow_up_at}
Prochaine action : {next_action}

NOTES UTILISATEUR :
----------------
{application.notes}
----------------

FORMAT DE SORTIE :
Retourne exactement les champs demandés par le schéma JSON.

- subject : objet de l'email
- message : corps complet du message
- tone : toujours "professional"
"""

    response = client.responses.create(
        model=model,
        reasoning={
            "effort": "low",
        },
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "careerai_follow_up",
                "strict": True,
                "schema": FOLLOW_UP_SCHEMA,
            }
        },
    )

    if not response.output_text:
        raise ValueError(
            "OpenAI n'a retourné aucune relance."
        )

    data = json.loads(response.output_text)

    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()
    tone = data.get("tone", "").strip()

    if not subject or not message:
        raise ValueError(
            "La relance générée est incomplète."
        )

    return {
        "subject": subject,
        "message": message,
        "tone": tone,
    }
