# رسوم المعمارية — مساعد تصميم الخوارزميات (AlgoAG)

## ١. معمارية النظام العامة

```mermaid
flowchart TB
    subgraph Browser["المتصفح"]
        Home[Home.jsx]
        Suggestions[Suggestions.jsx]
        Results[Results.jsx]
        CFsolve[CodeforcesSolve.jsx]
        CFresult[CodeforcesResult.jsx]
        Problems[Problems/Index+Show]
        Courses[Courses/Index+Show]
        Submissions[Submissions/Index]
        AuthPages[Auth Login+Register]
    end

    subgraph Laravel["Laravel"]
        Routes[routes/web.php]
        AA[AlgorithmAssistantController]
        CFctrl[CodeforcesSolveController]
        PC[ProblemController]
        CC[CourseController]
        SC[SubmissionController]
        AuthC[Auth Controllers]
        Routes --> AA
        Routes --> CFctrl
        Routes --> PC
        Routes --> CC
        Routes --> SC
        Routes --> AuthC
    end

    subgraph Services["الخدمات"]
        OllamaSvc[OllamaService]
        BenchmarkSvc[BenchmarkRunner]
        Solver[CodeforcesSolverService]
        Judge[StubCodeJudge]
    end

    subgraph Async["خلفية"]
        Job[ProcessCodeforcesSolutionJob]
        Q[(Queue / sync)]
    end

    subgraph Data["البيانات"]
        UserM[User]
        AlgS[AlgorithmSession]
        CfS[CodeforcesSolution]
        Prob[Problem / Tag / Course / Lesson / Submission]
        DB[(SQLite)]
        UserM --> DB
        AlgS --> DB
        CfS --> DB
        Prob --> DB
    end

    subgraph External["خارجي"]
        Ollama[Ollama :11434]
    end

    Browser <-->|Inertia + CSRF + جلسة| Laravel
    AA --> OllamaSvc
    AA --> BenchmarkSvc
    AA --> AlgS
    CFctrl --> OllamaSvc
    CFctrl --> CfS
    CFctrl --> Job
    Job --> Q
    Q --> Solver
    Solver --> OllamaSvc
    Solver --> Judge
    Solver --> CfS
    OllamaSvc <-->|HTTP| Ollama
    PC --> Prob
    CC --> Prob
    SC --> Prob
```

## ٢. تدفق مساعد الخوارزميات (اقتراح + محاكاة)

```mermaid
sequenceDiagram
    participant U as المستخدم
    participant Home as Home
    participant Ctrl as AlgorithmAssistantController
    participant Ollama as OllamaService
    participant Bench as BenchmarkRunner
    participant DB as SQLite

    U->>Home: وصف المسألة
    U->>Home: اقترح خوارزميات
    Home->>Ctrl: POST /suggest
    Ctrl->>Ollama: suggestAlgorithms
    Ollama-->>Ctrl: suggestions
    Ctrl-->>Home: Inertia Suggestions

    U->>Home: محاكاة الأداء
    Home->>Ctrl: POST /benchmark
    Ctrl->>Bench: runAll
    Bench-->>Ctrl: results
    Ctrl->>Ollama: recommend
    Ollama-->>Ctrl: نص التوصية
    Ctrl->>DB: AlgorithmSession::create(user_id, ...)
    Ctrl-->>Home: Inertia Results
```

## ٣. تدفق حل Codeforces (طابور + اقتسام)

```mermaid
sequenceDiagram
    participant U as المستخدم
    participant CF as CodeforcesSolve
    participant Ctrl as CodeforcesSolveController
    participant Q as Queue
    participant Job as ProcessCodeforcesSolutionJob
    participant Sol as CodeforcesSolverService
    participant Ollama as Ollama
    participant J as StubCodeJudge
    participant DB as codeforces_solutions

    U->>CF: POST /solve
    CF->>Ctrl: نص المسألة
    Ctrl->>DB: إنشاء صف pending + job_id
    Ctrl->>Q: dispatch Job بعد الاستجابة
    Ctrl-->>U: redirect /solve/result/{id}

    Q->>Job: handle
    Job->>Sol: runPipeline(id)
    Sol->>Ollama: عدة استدعاءات generate
    Sol->>J: judge (run_results تجريبي)
    Sol->>DB: تحديث مكتمل/فشل

    loop اقتسام
        U->>Ctrl: GET /solve/result/{id}/status
        Ctrl-->>U: JSON { status }
    end
```

## ٤. خريطة المسارات (أساسية)

```mermaid
flowchart LR
    subgraph auth_guest ["ضيف"]
        L["GET/POST /login"]
        R["GET/POST /register"]
    end

    subgraph auth_user ["مسجّل + throttle"]
        H["GET /"]
        Sg["POST /suggest"]
        Bm["POST /benchmark"]
        Ses["GET /session/:id"]
        Solv["GET|POST /solve"]
        Res["GET /solve/result/:id"]
        St["GET /solve/result/:id/status"]
        Pr["GET /problems"]
        Pr1["GET /problems/:id"]
        Cr["GET /courses"]
        Cr1["GET /courses/:id"]
        Sub["GET /submissions"]
        SubP["POST /submissions"]
        Lo["POST /logout"]
    end
```

---

*مكمّل لتقرير التدقيق `FULL-PROJECT-AUDIT-AR.md` و`README.md`.*
