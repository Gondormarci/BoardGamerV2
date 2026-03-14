# BoardGamer — AWS Infrastructure Diagram

This file contains Mermaid diagrams for infrastructure and deployment. Render in GitHub, VS Code (Mermaid extension), or [mermaid.live](https://mermaid.live).

---

## AWS Infrastructure Overview

```mermaid
flowchart TB
    subgraph Users["Users (EU)"]
        Browser[Web Browser]
    end

    subgraph DNS["DNS"]
        Route53[Route53 Hosted Zone]
    end

    subgraph Edge["Edge / Security"]
        CloudFront[CloudFront CDN - Optional]
        WAF[AWS WAF - Optional]
        ACM[ACM Certificate]
    end

    subgraph Public["Public Subnets (EU Region)"]
        ALB[Application Load Balancer]
    end

    subgraph Private["Private Subnets"]
        subgraph ECS["ECS Fargate Cluster"]
            API[ASP.NET Core API]
            SignalR[SignalR Hub]
        end
    end

    subgraph Data["Data Layer"]
        RDS[(RDS PostgreSQL)]
        Redis[ElastiCache Redis]
    end

    subgraph Auth["Authentication"]
        Keycloak[Keycloak IdP]
    end

    subgraph DevOps["DevOps"]
        ECR[ECR - Container Registry]
        S3State[S3 - Terraform State]
        GitHub[GitHub + GitHub Actions]
    end

    Browser --> Route53
    Route53 --> CloudFront
    CloudFront --> WAF
    WAF --> ALB
    ALB --> ACM
    ALB --> API
    ALB --> SignalR
    API --> RDS
    API --> Keycloak
    SignalR --> Redis
    SignalR --> RDS
    API --> Redis
    GitHub --> ECR
    GitHub --> S3State
```

---

## Simplified Network Topology

```mermaid
flowchart LR
    subgraph Internet
        User[User]
    end

    subgraph AWS["AWS (eu-west-1)"]
        subgraph VPC["VPC"]
            subgraph Public["Public Subnets"]
                ALB[ALB]
                NAT[NAT Gateway]
            end
            subgraph Private["Private Subnets"]
                ECS[ECS Fargate]
                RDS[(RDS)]
                Redis[Redis]
            end
        end
        Keycloak[Keycloak]
    end

    User -->|HTTPS| ALB
    ALB --> ECS
    ECS --> RDS
    ECS --> Redis
    ECS --> Keycloak
```

---

## CI/CD Pipeline (GitHub Actions)

```mermaid
flowchart LR
    subgraph GitHub["GitHub"]
        Push[Push / PR]
        Merge[Merge to main]
    end

    subgraph CI["CI"]
        BuildAPI[Build .NET API]
        TestAPI[Test API]
        BuildUI[Build React]
        TestUI[Test React]
    end

    subgraph CD["CD"]
        Docker[Build & Push to ECR]
        TFPlan[Terraform Plan]
        TFApply[Terraform Apply]
        Deploy[Update ECS Service]
    end

    Push --> BuildAPI
    Push --> BuildUI
    BuildAPI --> TestAPI
    BuildUI --> TestUI
    Merge --> Docker
    Docker --> TFPlan
    TFPlan --> TFApply
    TFApply --> Deploy
```

---

## Authentication Flow (Keycloak + SPA + API)

```mermaid
sequenceDiagram
    participant U as User
    participant SPA as React SPA
    participant K as Keycloak
    participant API as ASP.NET Core API

    U->>SPA: Open app
    SPA->>K: Redirect to login (PKCE)
    K->>U: Login form
    U->>K: Credentials
    K->>SPA: Redirect + auth code
    SPA->>K: Exchange code + PKCE verifier
    K->>SPA: Access token + refresh token
    SPA->>API: Request + Bearer token
    API->>K: Validate JWT (issuer/audience/signature)
    K-->>API: Valid
    API->>API: Authorize (roles)
    API-->>SPA: Response
```
