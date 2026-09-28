from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cvs.models import GeneratedResume, Resume
from jobs.models import Job

from .models import (
    Analysis,
    CoverLetter,
    CVOptimization,
    InterviewAnswer,
    InterviewPreparation,
    InterviewReport,
    JobRecommendation,
)
from .services import match_resume_to_job, build_skills_gap
from .ai_service import (
    analyze_resume_with_ai,
    evaluate_interview_answer_with_ai,
    generate_cover_letter_with_ai,
    generate_follow_up_with_ai,
    generate_cv_optimization_with_ai,
    generate_optimized_resume_with_ai,
    generate_interview_report_with_ai,
    generate_interview_preparation_with_ai,
    generate_job_recommendation_with_ai,
    get_candidate_profile_context,
)


def serialize_analysis(analysis):
    return {
        "id": analysis.id,
        "resume": {
            "id": analysis.resume.id,
            "title": analysis.resume.title,
        },
        "job": {
            "id": analysis.job.id,
            "title": analysis.job.title,
            "company": analysis.job.company,
            "location": analysis.job.location,
        },
        "matching": {
            "overall_score": analysis.overall_score,
            "skill_score": analysis.skill_score,
            "experience_score": analysis.experience_score,
            "education_score": analysis.education_score,
            "matching_skills": analysis.matching_skills,
            "missing_skills": analysis.missing_skills,
        },
        "ai_available": analysis.ai_available,
        "ai_analysis": analysis.ai_analysis,
        "created_at": analysis.created_at,
    }


def serialize_cover_letter(cover_letter):
    return {
        "id": cover_letter.id,
        "analysis_id": cover_letter.analysis_id,
        "content": cover_letter.content,
        "created_at": cover_letter.created_at,
        "updated_at": cover_letter.updated_at,
    }


def serialize_interview_preparation(preparation):
    return {
        "id": preparation.id,
        "analysis_id": preparation.analysis_id,
        "questions": preparation.questions,
        "general_advice": preparation.general_advice,
        "created_at": preparation.created_at,
        "updated_at": preparation.updated_at,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def match_resume_job(request):
    resume_id = request.data.get("resume_id")
    job_id = request.data.get("job_id")

    if not resume_id or not job_id:
        return Response(
            {
                "detail": (
                    "resume_id et job_id sont obligatoires."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user,
        )
    except Resume.DoesNotExist:
        return Response(
            {"detail": "CV introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        job = Job.objects.get(
            id=job_id,
            user=request.user,
        )
    except Job.DoesNotExist:
        return Response(
            {"detail": "Offre introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    matching = match_resume_to_job(
        resume,
        job,
    )

    try:
        ai_analysis = analyze_resume_with_ai(
            resume,
            job,
        )
        ai_available = True
    except Exception as exc:
        print(
            "CAREERAI ANALYSIS ERROR:",
            repr(exc),
        )
        ai_analysis = None
        ai_available = False

    analysis = Analysis.objects.create(
        user=request.user,
        resume=resume,
        job=job,
        overall_score=matching["overall_score"],
        skill_score=matching.get("skill_score"),
        experience_score=matching.get(
            "experience_score"
        ),
        education_score=matching.get(
            "education_score"
        ),
        matching_skills=matching.get(
            "matching_skills",
            [],
        ),
        missing_skills=matching.get(
            "missing_skills",
            [],
        ),
        ai_available=ai_available,
        ai_analysis=ai_analysis,
    )

    return Response(
        serialize_analysis(analysis),
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analysis_history(request):
    analyses = (
        Analysis.objects
        .filter(user=request.user)
        .select_related("resume", "job")
        .order_by("-created_at")
    )

    return Response(
        [
            serialize_analysis(analysis)
            for analysis in analyses
        ]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analysis_detail(request, analysis_id):
    try:
        analysis = (
            Analysis.objects
            .select_related("resume", "job")
            .get(
                id=analysis_id,
                user=request.user,
            )
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        serialize_analysis(analysis)
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_cover_letter(request, analysis_id):
    try:
        analysis = (
            Analysis.objects
            .select_related("resume", "job")
            .get(
                id=analysis_id,
                user=request.user,
            )
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        content = generate_cover_letter_with_ai(
            analysis
        )
    except Exception as exc:
        print(
            "CAREERAI COVER LETTER ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible de générer la lettre "
                    "de motivation pour le moment."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    cover_letter = CoverLetter.objects.create(
        user=request.user,
        analysis=analysis,
        content=content,
    )

    return Response(
        serialize_cover_letter(cover_letter),
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cover_letter_history(request, analysis_id):
    try:
        analysis = Analysis.objects.get(
            id=analysis_id,
            user=request.user,
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    cover_letters = CoverLetter.objects.filter(
        user=request.user,
        analysis=analysis,
    ).order_by("-created_at")

    return Response(
        [
            serialize_cover_letter(letter)
            for letter in cover_letters
        ]
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def cover_letter_detail(
    request,
    cover_letter_id,
):
    try:
        cover_letter = CoverLetter.objects.get(
            id=cover_letter_id,
            user=request.user,
        )
    except CoverLetter.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Lettre de motivation introuvable."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(
            serialize_cover_letter(cover_letter)
        )

    if request.method == "PATCH":
        content = request.data.get("content")

        if content is None:
            return Response(
                {
                    "detail": (
                        "Le champ content est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(content, str):
            return Response(
                {
                    "detail": (
                        "Le contenu doit être du texte."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = content.strip()

        if not content:
            return Response(
                {
                    "detail": (
                        "La lettre de motivation "
                        "ne peut pas être vide."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cover_letter.content = content
        cover_letter.save(
            update_fields=[
                "content",
                "updated_at",
            ]
        )

        return Response(
            serialize_cover_letter(cover_letter)
        )

    cover_letter.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_interview_preparation(
    request,
    analysis_id,
):
    try:
        analysis = (
            Analysis.objects
            .select_related("resume", "job")
            .get(
                id=analysis_id,
                user=request.user,
            )
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        data = (
            generate_interview_preparation_with_ai(
                analysis
            )
        )
    except Exception as exc:
        print(
            "CAREERAI INTERVIEW ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible de générer la préparation "
                    "à l'entretien pour le moment."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    preparation = (
        InterviewPreparation.objects.create(
            user=request.user,
            analysis=analysis,
            questions=data["questions"],
            general_advice=data["general_advice"],
        )
    )

    return Response(
        serialize_interview_preparation(
            preparation
        ),
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def interview_preparation_history(
    request,
    analysis_id,
):
    try:
        analysis = Analysis.objects.get(
            id=analysis_id,
            user=request.user,
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    preparations = (
        InterviewPreparation.objects
        .filter(
            user=request.user,
            analysis=analysis,
        )
        .order_by("-created_at")
    )

    return Response(
        [
            serialize_interview_preparation(
                preparation
            )
            for preparation in preparations
        ]
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def interview_preparation_detail(
    request,
    preparation_id,
):
    try:
        preparation = (
            InterviewPreparation.objects.get(
                id=preparation_id,
                user=request.user,
            )
        )
    except InterviewPreparation.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Préparation d'entretien "
                    "introuvable."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(
            serialize_interview_preparation(
                preparation
            )
        )

    if request.method == "PATCH":
        questions = request.data.get(
            "questions"
        )
        general_advice = request.data.get(
            "general_advice"
        )

        if (
            questions is None
            and general_advice is None
        ):
            return Response(
                {
                    "detail": (
                        "Aucune modification fournie."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = []

        if questions is not None:
            if not isinstance(questions, list):
                return Response(
                    {
                        "detail": (
                            "questions doit être "
                            "une liste."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            preparation.questions = questions
            update_fields.append("questions")

        if general_advice is not None:
            if not isinstance(
                general_advice,
                list,
            ):
                return Response(
                    {
                        "detail": (
                            "general_advice doit "
                            "être une liste."
                        )
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

            preparation.general_advice = (
                general_advice
            )
            update_fields.append(
                "general_advice"
            )

        update_fields.append("updated_at")

        preparation.save(
            update_fields=update_fields
        )

        return Response(
            serialize_interview_preparation(
                preparation
            )
        )

    preparation.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )



def serialize_interview_answer(interview_answer):
    return {
        "id": interview_answer.id,
        "preparation_id": interview_answer.preparation_id,
        "question_index": interview_answer.question_index,
        "question_type": interview_answer.question_type,
        "question": interview_answer.question,
        "answer": interview_answer.answer,
        "feedback": interview_answer.feedback,
        "created_at": interview_answer.created_at,
        "updated_at": interview_answer.updated_at,
    }


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def interview_answers(
    request,
    preparation_id,
):
    try:
        preparation = (
            InterviewPreparation.objects
            .select_related(
                "analysis__resume",
                "analysis__job",
            )
            .get(
                id=preparation_id,
                user=request.user,
            )
        )
    except InterviewPreparation.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Préparation d'entretien introuvable."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        answers = (
            InterviewAnswer.objects
            .filter(
                user=request.user,
                preparation=preparation,
            )
            .order_by("question_index")
        )

        return Response(
            [
                serialize_interview_answer(item)
                for item in answers
            ]
        )

    question_index = request.data.get(
        "question_index"
    )
    answer = request.data.get(
        "answer"
    )

    if (
        isinstance(question_index, bool)
        or not isinstance(question_index, int)
    ):
        return Response(
            {
                "detail": (
                    "question_index doit être un entier."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    questions = preparation.questions

    if (
        question_index < 0
        or question_index >= len(questions)
    ):
        return Response(
            {
                "detail": (
                    "Indice de question invalide."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(answer, str):
        return Response(
            {
                "detail": (
                    "La réponse doit être du texte."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    answer = answer.strip()

    if not answer:
        return Response(
            {
                "detail": (
                    "La réponse ne peut pas être vide."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    question_data = questions[
        question_index
    ]

    question = question_data.get(
        "question",
        "",
    )

    question_type = question_data.get(
        "type",
        "",
    )

    try:
        feedback = (
            evaluate_interview_answer_with_ai(
                preparation=preparation,
                question_index=question_index,
                answer=answer,
            )
        )
    except Exception as exc:
        print(
            "CAREERAI INTERVIEW ANSWER ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible d'analyser la réponse "
                    "pour le moment."
                )
            },
            status=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )

    interview_answer, created = (
        InterviewAnswer.objects.update_or_create(
            user=request.user,
            preparation=preparation,
            question_index=question_index,
            defaults={
                "question_type": question_type,
                "question": question,
                "answer": answer,
                "feedback": feedback,
            },
        )
    )

    # Une réponse vient d'être créée ou réévaluée.
    # Un éventuel bilan final précédent est donc obsolète.
    InterviewReport.objects.filter(
        user=request.user,
        preparation=preparation,
    ).delete()

    response_status = (
        status.HTTP_201_CREATED
        if created
        else status.HTTP_200_OK
    )

    return Response(
        serialize_interview_answer(
            interview_answer
        ),
        status=response_status,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def interview_report(
    request,
    preparation_id,
):
    try:
        preparation = (
            InterviewPreparation.objects
            .select_related(
                "analysis__job",
            )
            .get(
                id=preparation_id,
                user=request.user,
            )
        )
    except InterviewPreparation.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Préparation d'entretien introuvable."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    answers = list(
        InterviewAnswer.objects.filter(
            user=request.user,
            preparation=preparation,
        ).order_by("question_index")
    )

    total_questions = len(
        preparation.questions
    )

    answered_questions = len(answers)

    completion_percentage = (
        round(
            (
                answered_questions
                / total_questions
            )
            * 100,
            1,
        )
        if total_questions
        else 0
    )

    scored_answers = []

    for answer in answers:
        feedback = answer.feedback or {}
        score = feedback.get("score")

        if isinstance(score, (int, float)):
            scored_answers.append(
                {
                    "question_index":
                        answer.question_index,
                    "question":
                        answer.question,
                    "question_type":
                        answer.question_type,
                    "score":
                        score,
                }
            )

    scores = [
        item["score"]
        for item in scored_answers
    ]

    average_score = (
        round(
            sum(scores) / len(scores),
            1,
        )
        if scores
        else None
    )

    best_answer = (
        max(
            scored_answers,
            key=lambda item: item["score"],
        )
        if scored_answers
        else None
    )

    weakest_answer = (
        min(
            scored_answers,
            key=lambda item: item["score"],
        )
        if scored_answers
        else None
    )

    completed = (
        total_questions > 0
        and answered_questions
        == total_questions
    )

    return Response(
        {
            "preparation_id":
                preparation.id,
            "analysis_id":
                preparation.analysis_id,
            "job": {
                "title":
                    preparation.analysis.job.title,
                "company":
                    preparation.analysis.job.company,
            },
            "total_questions":
                total_questions,
            "answered_questions":
                answered_questions,
            "completion_percentage":
                completion_percentage,
            "average_score":
                average_score,
            "highest_score": (
                best_answer["score"]
                if best_answer
                else None
            ),
            "lowest_score": (
                weakest_answer["score"]
                if weakest_answer
                else None
            ),
            "best_answer":
                best_answer,
            "weakest_answer":
                weakest_answer,
            "completed":
                completed,
        }
    )


def serialize_interview_report(
    interview_report,
):
    return {
        "id": interview_report.id,
        "preparation_id":
            interview_report.preparation_id,
        "average_score":
            interview_report.average_score,
        "report":
            interview_report.report,
        "created_at":
            interview_report.created_at,
        "updated_at":
            interview_report.updated_at,
    }


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def final_interview_report(
    request,
    preparation_id,
):
    try:
        preparation = (
            InterviewPreparation.objects
            .select_related(
                "analysis__resume",
                "analysis__job",
            )
            .get(
                id=preparation_id,
                user=request.user,
            )
        )
    except InterviewPreparation.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Préparation d'entretien introuvable."
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        try:
            interview_report = (
                InterviewReport.objects.get(
                    user=request.user,
                    preparation=preparation,
                )
            )
        except InterviewReport.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Aucun bilan final n'a encore "
                        "été généré."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            serialize_interview_report(
                interview_report
            )
        )

    total_questions = len(
        preparation.questions
    )

    answered_questions = (
        InterviewAnswer.objects.filter(
            user=request.user,
            preparation=preparation,
            feedback__isnull=False,
        ).count()
    )

    if (
        total_questions == 0
        or answered_questions != total_questions
    ):
        return Response(
            {
                "detail": (
                    "Toutes les réponses doivent être "
                    "analysées avant de générer le "
                    "bilan final."
                ),
                "answered_questions":
                    answered_questions,
                "total_questions":
                    total_questions,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        generated = (
            generate_interview_report_with_ai(
                preparation
            )
        )
    except ValueError as exc:
        return Response(
            {
                "detail": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        print(
            "CAREERAI INTERVIEW REPORT ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible de générer le bilan "
                    "final pour le moment."
                )
            },
            status=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )

    interview_report, created = (
        InterviewReport.objects.update_or_create(
            user=request.user,
            preparation=preparation,
            defaults={
                "average_score":
                    generated["average_score"],
                "report":
                    generated["report"],
            },
        )
    )

    response_status = (
        status.HTTP_201_CREATED
        if created
        else status.HTTP_200_OK
    )

    return Response(
        serialize_interview_report(
            interview_report
        ),
        status=response_status,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    user = request.user

    analyses = (
        Analysis.objects
        .filter(user=user)
        .select_related("resume", "job")
        .order_by("-created_at")
    )

    applications = (
        user.applications
        .select_related("job")
        .order_by("-created_at")
    )

    preparations = (
        InterviewPreparation.objects
        .filter(user=user)
        .select_related("analysis__job")
        .prefetch_related("answers")
        .order_by("-created_at")
    )

    resume_count = user.resumes.count()
    job_count = user.jobs.count()
    analysis_count = analyses.count()
    application_count = applications.count()

    active_application_count = applications.filter(
        status__in=[
            "draft",
            "sent",
            "interview",
        ]
    ).count()

    interview_application_count = applications.filter(
        status="interview"
    ).count()

    application_pipeline = {
        "draft": applications.filter(
            status="draft"
        ).count(),
        "sent": applications.filter(
            status="sent"
        ).count(),
        "interview": interview_application_count,
        "accepted": applications.filter(
            status="accepted"
        ).count(),
        "rejected": applications.filter(
            status="rejected"
        ).count(),
    }

    scores = list(
        analyses.values_list(
            "overall_score",
            flat=True,
        )
    )

    average_match_score = (
        round(sum(scores) / len(scores), 1)
        if scores
        else None
    )

    recent_analyses = [
        {
            "id": analysis.id,
            "resume": {
                "id": analysis.resume_id,
                "title": analysis.resume.title,
            },
            "job": {
                "id": analysis.job_id,
                "title": analysis.job.title,
                "company": analysis.job.company,
            },
            "overall_score": analysis.overall_score,
            "created_at": analysis.created_at,
        }
        for analysis in analyses[:5]
    ]

    recent_applications = [
        {
            "id": application.id,
            "job": {
                "id": application.job_id,
                "title": application.job.title,
                "company": application.job.company,
            },
            "status": application.status,
            "applied_at": application.applied_at,
            "created_at": application.created_at,
        }
        for application in applications[:5]
    ]

    interview_progress = []

    for preparation in preparations[:5]:
        total_questions = len(
            preparation.questions or []
        )

        analyzed_answers = sum(
            1
            for answer in preparation.answers.all()
            if answer.feedback is not None
        )

        completion_percentage = (
            round(
                analyzed_answers
                / total_questions
                * 100,
                1,
            )
            if total_questions
            else 0
        )

        interview_progress.append(
            {
                "preparation_id": preparation.id,
                "analysis_id":
                    preparation.analysis_id,
                "job": {
                    "title":
                        preparation.analysis.job.title,
                    "company":
                        preparation.analysis.job.company,
                },
                "answered_questions":
                    analyzed_answers,
                "total_questions":
                    total_questions,
                "completion_percentage":
                    completion_percentage,
                "completed": (
                    total_questions > 0
                    and analyzed_answers
                    == total_questions
                ),
                "has_final_report": (
                    InterviewReport.objects.filter(
                        user=user,
                        preparation=preparation,
                    ).exists()
                ),
                "updated_at":
                    preparation.updated_at,
            }
        )

    actions = []

    incomplete_interview = next(
        (
            item
            for item in interview_progress
            if not item["completed"]
        ),
        None,
    )

    completed_without_report = next(
        (
            item
            for item in interview_progress
            if (
                item["completed"]
                and not item["has_final_report"]
            )
        ),
        None,
    )

    if incomplete_interview:
        actions.append(
            {
                "type": "continue_interview",
                "title":
                    "Continuer ma simulation d'entretien",
                "description": (
                    f'{incomplete_interview["answered_questions"]}'
                    f'/{incomplete_interview["total_questions"]} '
                    "questions analysées"
                ),
                "href": (
                    "/interview/"
                    f'{incomplete_interview["preparation_id"]}'
                ),
            }
        )

    if completed_without_report:
        actions.append(
            {
                "type": "generate_interview_report",
                "title":
                    "Générer mon bilan d'entretien",
                "description": (
                    "La simulation est terminée. "
                    "Ton bilan final IA est prêt "
                    "à être généré."
                ),
                "href": (
                    "/interview/"
                    f'{completed_without_report["preparation_id"]}'
                ),
            }
        )

    if analyses.exists():
        latest_analysis = analyses.first()

        actions.append(
            {
                "type": "review_analysis",
                "title":
                    "Consulter ma dernière analyse",
                "description": (
                    f"{latest_analysis.job.title} · "
                    f"{latest_analysis.job.company}"
                ),
                "href": (
                    f"/analysis/{latest_analysis.id}"
                ),
            }
        )
    else:
        actions.append(
            {
                "type": "create_analysis",
                "title":
                    "Créer ma première analyse",
                "description": (
                    "Compare ton CV à une offre "
                    "avec CareerAI."
                ),
                "href": "/analysis/new",
            }
        )

    return Response(
        {
            "stats": {
                "resumes": resume_count,
                "jobs": job_count,
                "analyses": analysis_count,
                "applications":
                    application_count,
                "active_applications":
                    active_application_count,
                "interviews":
                    interview_application_count,
                "average_match_score":
                    average_match_score,
            },
            "application_pipeline":
                application_pipeline,
            "recent_analyses":
                recent_analyses,
            "recent_applications":
                recent_applications,
            "interview_progress":
                interview_progress,
            "actions":
                actions[:4],
        }
    )



def serialize_cv_optimization(cv_optimization):
    return {
        "id": cv_optimization.id,
        "analysis_id": cv_optimization.analysis_id,
        "optimization": cv_optimization.optimization,
        "created_at": cv_optimization.created_at,
        "updated_at": cv_optimization.updated_at,
    }


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cv_optimization(request, analysis_id):
    try:
        analysis = Analysis.objects.select_related(
            "resume",
            "job",
        ).get(
            id=analysis_id,
            user=request.user,
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        try:
            optimization = CVOptimization.objects.get(
                user=request.user,
                analysis=analysis,
            )
        except CVOptimization.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Aucune optimisation de CV "
                        "n'a encore été générée."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            serialize_cv_optimization(optimization)
        )

    try:
        result = generate_cv_optimization_with_ai(
            analysis
        )
    except Exception as exc:
        return Response(
            {
                "detail": (
                    "Impossible de générer "
                    "l'optimisation du CV."
                ),
                "error": str(exc),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    optimization, created = (
        CVOptimization.objects.update_or_create(
            user=request.user,
            analysis=analysis,
            defaults={
                "optimization": result,
            },
        )
    )

    return Response(
        serialize_cv_optimization(optimization),
        status=(
            status.HTTP_201_CREATED
            if created
            else status.HTTP_200_OK
        ),
    )


def serialize_generated_resume(generated_resume):
    return {
        "id": generated_resume.id,
        "analysis_id": generated_resume.analysis_id,
        "source_resume_id": generated_resume.source_resume_id,
        "title": generated_resume.title,
        "version": generated_resume.version,
        "content": generated_resume.content,
        "created_at": generated_resume.created_at,
        "updated_at": generated_resume.updated_at,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generated_resume_history(request, analysis_id):
    try:
        analysis = Analysis.objects.get(
            id=analysis_id,
            user=request.user,
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    generated_resumes = (
        GeneratedResume.objects
        .filter(
            user=request.user,
            analysis=analysis,
        )
        .order_by("-version")
    )

    return Response(
        [
            serialize_generated_resume(generated)
            for generated in generated_resumes
        ]
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def generated_resume(request, analysis_id):
    try:
        analysis = Analysis.objects.select_related(
            "resume",
            "job",
        ).get(
            id=analysis_id,
            user=request.user,
        )
    except Analysis.DoesNotExist:
        return Response(
            {"detail": "Analyse introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        generated = (
            GeneratedResume.objects
            .filter(
                user=request.user,
                analysis=analysis,
            )
            .order_by("-version")
            .first()
        )

        if generated is None:
            return Response(
                {
                    "detail": (
                        "Aucun CV généré n'est encore disponible."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            serialize_generated_resume(generated)
        )

    try:
        optimization = CVOptimization.objects.get(
            user=request.user,
            analysis=analysis,
        )
    except CVOptimization.DoesNotExist:
        return Response(
            {
                "detail": (
                    "Génère d'abord l'optimisation du CV."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        content = generate_optimized_resume_with_ai(
            analysis,
            optimization,
        )
    except Exception as exc:
        print(
            "CAREERAI GENERATED RESUME ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible de générer le CV optimisé."
                ),
                "error": str(exc),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    latest_generated = (
        GeneratedResume.objects
        .filter(
            user=request.user,
            analysis=analysis,
        )
        .order_by("-version")
        .first()
    )

    next_version = (
        latest_generated.version + 1
        if latest_generated
        else 1
    )

    generated = GeneratedResume.objects.create(
        user=request.user,
        source_resume=analysis.resume,
        analysis=analysis,
        title=(
            f"CV optimisé - "
            f"{analysis.job.title} - "
            f"{analysis.job.company}"
        ),
        content=content,
        version=next_version,
    )

    return Response(
        serialize_generated_resume(generated),
        status=status.HTTP_201_CREATED,
    )



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def skills_gap(request):
    resume_id = request.query_params.get("resume_id")

    if not resume_id:
        return Response(
            {"detail": "resume_id est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user,
        )
    except (Resume.DoesNotExist, ValueError):
        return Response(
            {"detail": "CV introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not resume.extracted_text.strip():
        return Response(
            {
                "detail": (
                    "Ce CV ne contient aucun texte exploitable."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    jobs = list(
        Job.objects.filter(
            user=request.user
        ).order_by("-created_at")
    )

    result = build_skills_gap(
        resume,
        jobs,
    )

    return Response(
        result,
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def job_recommendations(request):
    resume_id = request.query_params.get("resume_id")

    refresh = (
        request.query_params.get(
            "refresh",
            "false",
        ).lower()
        == "true"
    )

    if not resume_id:
        return Response(
            {
                "detail": "resume_id est obligatoire."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user,
        )
    except (Resume.DoesNotExist, ValueError):
        return Response(
            {
                "detail": "CV introuvable."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if not resume.extracted_text.strip():
        return Response(
            {
                "detail": (
                    "Ce CV ne contient aucun texte exploitable."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    jobs = Job.objects.filter(
        user=request.user
    ).order_by("-created_at")

    if not jobs.exists():
        return Response(
            {
                "resume": {
                    "id": resume.id,
                    "title": resume.title,
                },
                "count": 0,
                "cached_count": 0,
                "generated_count": 0,
                "recommendations": [],
            }
        )

    profile_context = get_candidate_profile_context(
        request.user
    )

    recommendations = []
    cached_count = 0
    generated_count = 0

    for job in jobs:
        try:
            cached = JobRecommendation.objects.filter(
                user=request.user,
                resume=resume,
                job=job,
            ).first()

            if cached is not None and not refresh:
                recommendation = cached.result
                cached_count += 1

            else:
                recommendation = (
                    generate_job_recommendation_with_ai(
                        resume=resume,
                        job=job,
                        profile_context=profile_context,
                    )
                )

                JobRecommendation.objects.update_or_create(
                    user=request.user,
                    resume=resume,
                    job=job,
                    defaults={
                        "score": recommendation["score"],
                        "result": recommendation,
                    },
                )

                generated_count += 1

            recommendations.append(
                {
                    "job": {
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "source_url": job.source_url,
                    },
                    "score": recommendation["score"],
                    "match_level": recommendation[
                        "match_level"
                    ],
                    "summary": recommendation["summary"],
                    "matching_skills": recommendation[
                        "matching_skills"
                    ],
                    "missing_skills": recommendation[
                        "missing_skills"
                    ],
                    "reasons": recommendation["reasons"],
                    "recommendation": recommendation[
                        "recommendation"
                    ],
                }
            )

        except Exception as exc:
            print(
                "CAREERAI JOB RECOMMENDATION ERROR "
                f"(job={job.id}):",
                exc,
            )

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return Response(
        {
            "resume": {
                "id": resume.id,
                "title": resume.title,
            },
            "count": len(recommendations),
            "cached_count": cached_count,
            "generated_count": generated_count,
            "recommendations": recommendations,
        }
    )




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_application_follow_up(
    request,
    application_id,
):
    from applications.models import Application

    try:
        application = (
            Application.objects
            .select_related("job", "user")
            .get(
                id=application_id,
                user=request.user,
            )
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        follow_up = generate_follow_up_with_ai(
            application
        )
    except Exception as exc:
        print(
            "CAREERAI FOLLOW UP ERROR:",
            repr(exc),
        )

        return Response(
            {
                "detail": (
                    "Impossible de générer la relance "
                    "pour le moment."
                )
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        follow_up,
        status=status.HTTP_200_OK,
    )
