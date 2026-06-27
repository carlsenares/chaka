#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const outputPath = path.join(root, "data/features/source_extracts/local_research_context.json");
const isDryRun = process.argv.includes("--dry-run");

const evidenceCards = [
  {
    evidence_id: "local_research:alemayehu_haile:gimbo_soil_management_001",
    source_id: "Alemayehu Haile.pdf",
    source_type: "local_thesis_or_report",
    geography: {
      country: "Ethiopia",
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Kefa",
      woreda: "Gimbo",
      place_names: ["Gimbo District"],
    },
    topics: ["soil_fertility", "soil_management", "local_land_management"],
    intervention_tags: ["agroforestry", "soil_conservation", "native_tree_planting"],
    claim:
      "Local Gimbo soil-fertility research is relevant context for land-management and restoration recommendations in the Gimbo candidate site.",
    citation_locator: "local research evidence index; PDF requires manual page/table QA before quoting",
    confidence: "medium",
    allowed_use: "site_specific_implementation_caveat",
    not_allowed_use: "direct_score_override",
    review_status: "needs_manual_table_qa",
    match_rules: [{ field: "woreda", value: "Gimbo", match_type: "explicit_district" }],
  },
  {
    evidence_id: "local_research:wondimu_mamo:western_ethiopia_lulc_erosion_001",
    source_id: "Wondimu Mamo.pdf",
    source_type: "local_dissertation",
    geography: {
      country: "Ethiopia",
      region: "western Ethiopia",
      zone: null,
      woreda: null,
      place_names: ["Bururi Catchment"],
    },
    topics: ["land_use_change", "erosion", "soil_quality", "soil_organic_carbon"],
    intervention_tags: ["erosion_control_exclosures", "soil_conservation", "agroforestry"],
    claim:
      "Western Ethiopia catchment research is relevant comparable-landscape context for erosion, soil quality, and land-management caveats, but it is not site-specific to the candidate polygons.",
    citation_locator: "local research evidence index; PDF requires manual page/table QA before quoting",
    confidence: "medium_low",
    allowed_use: "comparable_landscape_caveat",
    not_allowed_use: "direct_score_override",
    review_status: "needs_manual_table_qa",
    match_rules: [{ field: "region_contains", value: "Southwest", match_type: "comparable_western_ethiopia" }],
  },
  {
    evidence_id: "local_research:nbsap:safeguard_policy_context_001",
    source_id: "Sixth-national-report-on-the-implementation-of-NBSAP-2015-2020.pdf",
    source_type: "official_national_report",
    geography: {
      country: "Ethiopia",
      region: null,
      zone: null,
      woreda: null,
      place_names: [],
    },
    topics: ["biodiversity_policy", "protected_areas", "ecosystem_services", "safeguards"],
    intervention_tags: ["field_validation_before_investment", "safeguard_screening"],
    claim:
      "National biodiversity reporting provides policy and safeguard context, including protected-area and ecosystem-service framing, but it is not a spatial protected-area overlap layer.",
    citation_locator: "local research evidence index; extract policy targets/protected-area context before frontend quoting",
    confidence: "medium_high",
    allowed_use: "national_policy_context",
    not_allowed_use: "protected_area_overlap_calculation",
    review_status: "needs_manual_section_qa",
    match_rules: [{ field: "country", value: "Ethiopia", match_type: "national_context" }],
  },
  {
    evidence_id: "local_research:ethiopia_frel_frl:forest_carbon_methods_001",
    source_id: "2026_submission_frel_frl_eth_final.pdf",
    source_type: "official_unfccc_submission",
    geography: {
      country: "Ethiopia",
      region: null,
      zone: null,
      woreda: null,
      place_names: [],
    },
    topics: ["forest_definition", "carbon_pools", "mrv", "uncertainty"],
    intervention_tags: ["native_tree_planting", "assisted_natural_regeneration", "carbon_mrv"],
    claim:
      "Ethiopia's FREL/FRL submission is useful for forest-carbon definitions, MRV framing, and coefficient QA, but it is not a candidate-site biomass raster.",
    citation_locator: "local research evidence index; extract definition/table references before quoting",
    confidence: "high",
    allowed_use: "methods_context",
    not_allowed_use: "site_specific_carbon_score_override",
    review_status: "needs_table_qa",
    match_rules: [{ field: "country", value: "Ethiopia", match_type: "national_context" }],
  },
  {
    evidence_id: "local_research:bale_migration_conservation:grazing_pressure_001",
    source_id: "migration-conservation-bale-mountains-ecosystem-report.pdf",
    source_type: "local_conservation_report",
    geography: {
      country: "Ethiopia",
      region: "Oromia",
      zone: "Bale",
      woreda: null,
      place_names: ["Bale Mountains ecosystem", "Harenna Forest"],
    },
    topics: ["grazing_pressure", "migration", "forest_pressure", "livelihoods", "conservation_governance"],
    intervention_tags: ["native_tree_planting", "assisted_natural_regeneration", "field_validation_before_investment"],
    claim:
      "Bale Mountains local research can inform general forest-edge implementation caveats such as grazing and livelihood pressure, but it is not geographically matched to the current South/Southwest Ethiopia candidates.",
    citation_locator: "local research evidence index; PDF requires manual claim-level QA before quoting",
    confidence: "low",
    allowed_use: "general_comparable_context_only",
    not_allowed_use: "site_specific_warning_without_manual_approval",
    review_status: "needs_manual_claim_qa",
    match_rules: [],
  },
  {
    evidence_id: "local_research:bale_livestock_settlement:wildlife_pressure_001",
    source_id: "Livestock and settlement - peer reviewed research paper may be useful for grazing patterns etc.pdf",
    source_type: "peer_reviewed_local_conservation_paper",
    geography: {
      country: "Ethiopia",
      region: "Oromia",
      zone: "Bale",
      woreda: null,
      place_names: ["Bale Mountains National Park"],
    },
    topics: ["livestock_pressure", "settlement_pressure", "wildlife_decline", "protected_area_management"],
    intervention_tags: ["native_tree_planting", "assisted_natural_regeneration", "safeguard_screening"],
    claim:
      "Peer-reviewed Bale Mountains research documents how livestock and settlement pressure can affect wildlife and protected-area restoration outcomes; use as a general implementation caveat, not as candidate-site overlap evidence.",
    citation_locator: "paper abstract and study-area sections; claim-level frontend quotes require manual page QA",
    confidence: "medium",
    allowed_use: "general_biodiversity_and_grazing_caveat",
    not_allowed_use: "site_specific_warning_without_manual_approval",
    review_status: "needs_manual_claim_qa",
    match_rules: [],
  },
  {
    evidence_id: "local_research:hagenia_abyssinica:local_species_value_001",
    source_id: "1746-4269-6-20 - peer reviewed research paper on local plants and medicine knowledge.pdf",
    source_type: "peer_reviewed_ethnobotany_paper",
    geography: {
      country: "Ethiopia",
      region: "Oromia/Amhara",
      zone: "Bale and other highland sites",
      woreda: null,
      place_names: ["Bale", "Kofele", "Debark"],
    },
    topics: ["local_species_value", "medicinal_plants", "species_conservation", "traditional_knowledge"],
    intervention_tags: ["native_tree_planting", "assisted_natural_regeneration", "species_selection"],
    claim:
      "Peer-reviewed ethnobotany research shows local cultural and medicinal value for Hagenia abyssinica and notes conservation pressure on the species; useful for species-selection caveats where agroecology matches.",
    citation_locator: "paper abstract and methodology sections; species recommendation requires local ecological/manual QA",
    confidence: "medium",
    allowed_use: "species_selection_context",
    not_allowed_use: "direct_species_prescription_or_score_override",
    review_status: "needs_manual_species_qa",
    match_rules: [{ field: "country", value: "Ethiopia", match_type: "national_species_context" }],
  },
  {
    evidence_id: "local_research:konso_bundle:dryland_context_001",
    source_id: "Konso-20260627T215313Z-3-001.zip",
    source_type: "zipped_local_context_bundle",
    geography: {
      country: "Ethiopia",
      region: "South Ethiopia",
      zone: "Konso",
      woreda: null,
      place_names: ["Konso"],
    },
    topics: ["dryland_restoration", "terracing", "cultural_landscape", "local_governance"],
    intervention_tags: ["erosion_control_exclosures", "soil_conservation", "field_validation_before_investment"],
    claim:
      "The Konso bundle is potentially useful for South Ethiopia dryland/soil-conservation context, but it is outside the current candidate zones and needs manual unpacking and QA.",
    citation_locator: "zip bundle; inspect contained reports before frontend citation",
    confidence: "low",
    allowed_use: "use_later_context",
    not_allowed_use: "candidate_scoring_or_site_specific_warning",
    review_status: "needs_manual_bundle_qa",
    match_rules: [],
  },
];

async function main() {
  const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
  const rows = candidates.features.map((feature) => summarizeCandidate(feature));
  const matchedRows = rows.filter((row) => row.matched_evidence_count > 0);

  const output = {
    source: {
      dataset_id: "local_research_context",
      name: "Curated local research evidence cards",
      provider: "Committed local PDF bundle and curated source matrix",
      source_path: "research/source_candidates/",
      evidence_index_path: "research/source_candidates/local_research_evidence_index.md",
      extraction_method:
        "Rule-based candidate matching over reviewed evidence-card metadata; no OCR-derived claim is used without manual QA status.",
      scoring_policy: "Context only. This artifact must not change priority scores without explicit scoring review.",
      generated_at: new Date().toISOString(),
    },
    evidence_cards: evidenceCards.map(({ match_rules: _matchRules, ...card }) => card),
    features: rows,
  };

  console.log(`Prepared ${evidenceCards.length} curated local research evidence cards`);
  console.log(`Matched local/context evidence to ${matchedRows.length}/${rows.length} candidate sites`);

  if (isDryRun) {
    for (const row of matchedRows) {
      console.log(`${row.site_id}: ${row.matched_evidence_count} cards (${row.match_types.join(", ")})`);
    }
    console.log("Dry run passed; no output written");
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

function summarizeCandidate(feature) {
  const properties = feature.properties;
  const matches = evidenceCards
    .map((card) => matchCard(card, properties))
    .filter(Boolean)
    .sort((a, b) => matchRank(a.match_type) - matchRank(b.match_type));

  return {
    site_id: properties.site_id,
    region: properties.region,
    zone: properties.zone,
    woreda: properties.woreda,
    matched_evidence_count: matches.length,
    matched_sources: [...new Set(matches.map((match) => match.source_id))],
    match_types: [...new Set(matches.map((match) => match.match_type))],
    evidence_refs: matches.map((match) => ({
      evidence_id: match.evidence_id,
      source_id: match.source_id,
      match_type: match.match_type,
      confidence: match.confidence,
      allowed_use: match.allowed_use,
      review_status: match.review_status,
    })),
    source_status: matches.length > 0 ? "context_derived" : "no_local_match",
  };
}

function matchCard(card, properties) {
  for (const rule of card.match_rules) {
    if (rule.field === "country" && rule.value === "Ethiopia") return toMatch(card, rule.match_type);
    if (rule.field === "woreda" && sameText(properties.woreda, rule.value)) return toMatch(card, rule.match_type);
    if (rule.field === "region_contains" && properties.region.includes(rule.value)) return toMatch(card, rule.match_type);
  }
  return null;
}

function toMatch(card, matchType) {
  return {
    evidence_id: card.evidence_id,
    source_id: card.source_id,
    match_type: matchType,
    confidence: card.confidence,
    allowed_use: card.allowed_use,
    review_status: card.review_status,
  };
}

function sameText(left, right) {
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
}

function matchRank(matchType) {
  const ranks = {
    explicit_district: 0,
    comparable_western_ethiopia: 1,
    national_context: 2,
    national_species_context: 3,
  };
  return ranks[matchType] ?? 99;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
