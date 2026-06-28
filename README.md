# Chaka Priority Atlas

<p align="center">
  <img src="logo/namecheap-logo2.png" alt="Chaka Priority Atlas logo" width="180" />
</p>

**Demo video:** [Watch the Chaka Priority Atlas demo](https://drive.google.com/file/d/11K84FAnUIb1_BetNMLux_ZpoZsitobSV/view?usp=sharing)

Chaka is an AI-assisted restoration decision-support prototype for Ethiopia. It helps NGOs, government teams, and impact investors compare candidate restoration areas using environmental indicators, livelihood context, and explainable recommendation outputs.

---

## Problem

Natural restoration funding decisions often require teams to compare biodiversity value, carbon storage potential, water and soil benefits, livelihood impact, implementation feasibility, and safeguard risk across many places. Those signals are usually spread across separate datasets and reports, making it difficult to prioritize areas transparently during planning.

## Solution

Chaka brings restoration evidence into one prioritization workflow. The platform ranks candidate areas, explains why areas score highly, previews recommended intervention types, and prepares outputs that can be reviewed by technical experts before field validation.

## Features

- Interactive Ethiopia map for restoration planning
- Ranked restoration opportunities
- Priority heatmap visualization
- Recommendation detail pages and project brief outputs
- Configurable priority weights
- Demo mode using bundled sample data
- Backend Preview mode using agent/sample pipeline outputs
- Explainable chatbot for recommendation Q&A
- Satellite and 2D map views

## Technology Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes for recommendations, site details, agent traces, and briefs
- **Mapping:** GeoJSON candidate areas and administrative boundary-ready outputs
- **AI:** Agent prompts, sample outputs, optional OpenAI-backed explainability
- **Data:** Mock/sample site features, processed candidate sites, source registry, and generated model artifacts

## Project Structure

- `app/` - Next.js pages and API routes
- `reasoning/` - scoring, recommendation, intervention, risk, explanation, and brief logic
- `agents/` - agent prompts, sample inputs, and sample outputs
- `api/` - API contracts and sample response payloads
- `data/` - source registry, processed AOIs, candidate sites, and feature artifacts
- `models/` - model schemas, prediction artifacts, and reports
- `scripts/` - data ingestion, feature extraction, validation, and ranking scripts
- `docs/` - methodology, data quality, sources, and handoff notes

## Running the Project

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Optional data pipeline dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Optional chatbot/API environment:

```bash
cp .env.example .env.local
```

Then set `OPENAI_API_KEY` if OpenAI-backed explanations are enabled. Keep local env files uncommitted.

## Demo Modes

**Demo Mode** uses bundled sample site features and generated artifacts so the prioritization workflow can be demonstrated without a live backend or external data calls.

**Backend Preview** uses the repository's agent and API sample outputs to show how the same interface can be powered by pipeline-generated recommendations, briefs, critics, and site details.

## Future Work

- Live backend integration for prioritization requests
- Automated real-time data ingestion and refresh
- Additional environmental and socioeconomic datasets
- Admin-boundary joins for region, zone, and woreda recommendations
- Multi-country restoration planning support

## License

Hackathon prototype.
