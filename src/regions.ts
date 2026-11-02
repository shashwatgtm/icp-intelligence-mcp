import type { VerticalId } from './verticals.ts';

// DRAFT for owner review. Lane G, 2 November 2026. No market figures or company facts.
// Region labels use the brief's fallback, pending owner confirmation.
// This file records checks to make, not facts about an individual buyer or legal clearance.
// Legal notes require a named jurisdiction and a linked source. Never infer a jurisdiction
// from currency, a company name, a language, a job title or an IP address.
// Source dates and scope are recorded in hub overnight-20261103/lane-g/REGION-SOURCES.md.
export type RegionId = 'india' | 'southeast-asia' | 'middle-east' | 'united-kingdom' | 'europe' | 'united-states';
export interface Region {
  id: RegionId;
  name: string;
  buying: string;
  procurement: string;
  language: string;
  proof: string;
}
export interface RegionSource { id: string; title: string; url: string; published: string; scope: string; checked: string }
export const REGION_REVIEW_DATE = '2026-11-02';
export const REGIONS: readonly Region[] = [
  { id: 'india', name: 'India',
    buying: 'Map the business sponsor, local operating team and contracting entity separately. Ask which decisions sit with the buyer and which need group approval.',
    procurement: 'Confirm the invoicing entity, currency, tax treatment, vendor registration, acceptance evidence and payment trigger with procurement. Use the buyer\'s terms, not an assumed regional payment period.',
    language: 'Check the working language of the buying team and the people who will use the product. A national rollout can need different language and training plans by location.',
    proof: 'Use a pilot in the buyer\'s actual operating setting and agree the support owner. Keep local implementation cost and measured benefit visible.' },
  { id: 'southeast-asia', name: 'Southeast Asia',
    buying: 'Name the countries and separate a regional headquarters decision from local entity approvals. A regional sponsor is not evidence that every local buyer has approved.',
    procurement: 'Confirm which entity signs and pays in each country, which currency is quoted and who accepts delivery. Do not carry one country\'s terms into the rest of the region.',
    language: 'Ask each country team which language they need for evaluation, operating instructions and support. Do not infer the answer from a regional headquarters.',
    proof: 'Run the proposed workflow with the country team that will use it. Check integrations and support arrangements country by country.' },
  { id: 'middle-east', name: 'Middle East',
    buying: 'Name the country, contracting entity and public or private procurement route. Ask who approves the supplier and who approves the business case.',
    procurement: 'Confirm the tender or vendor onboarding steps, local contracting requirements and payment acceptance milestone with the named buyer. Do not assume one Gulf country\'s process applies elsewhere.',
    language: 'Agree the language of the proposal, contract, training and support with the buyer. Ask whether an Arabic version is needed instead of assuming English is sufficient.',
    proof: 'Show the implementation and support plan for the named country, with a responsible delivery owner. Do not imply a local reference or presence that you cannot document.' },
  { id: 'united-kingdom', name: 'United Kingdom',
    buying: 'Separate the business sponsor from procurement, information security and the privacy reviewer. Ask which reviews apply to this use case and who can approve them.',
    procurement: 'Agree the order process, statement of work, service acceptance and invoice terms. Confirm whether the buyer is using a public procurement route before planning a direct sale.',
    language: 'Confirm the buying and operating teams\' preferred language and terminology. Use their contract and workflow terms in the proof pack.',
    proof: 'Provide a written data flow, implementation plan and buyer agreed success measure. Where a regulated buyer is involved, map evidence to its actual review checklist.' },
  { id: 'europe', name: 'Europe',
    buying: 'Name each country and distinguish the group sponsor from the local contracting entity. Europe alone does not identify the legal regime or approval process.',
    procurement: 'Confirm the contracting country, invoice currency, acceptance criteria and payment terms. Keep national and group reviews separate where the buyer requires both.',
    language: 'Ask which languages the evaluators, legal reviewers and operating teams need. Do not assume that an English sales meeting settles the language of rollout.',
    proof: 'Use documented acceptance tests and a support plan for the named country. Ask whether the buyer needs local language material or references before promising either.' },
  { id: 'united-states', name: 'United States',
    buying: 'Identify the buying entity, states involved and any regulated activity. Separate business approval from vendor security, privacy and procurement review.',
    procurement: 'Confirm vendor onboarding, purchase order requirements, contract terms, acceptance evidence and invoice timing with the buyer. Do not assume a standard national payment period.',
    language: 'Confirm the language and terminology needed by the actual users and evaluators. Match the buyer\'s workflow rather than inferring language from location.',
    proof: 'Use a buyer owned business case and a documented security and implementation pack. Identify which state and sector requirements the buyer wants evidenced.' }
];

export interface JurisdictionNote { label: string; privacy: string; sources: string[]; language?: string; proof?: string }
export const JURISDICTIONS: Record<string, JurisdictionNote> = {
  india: {label:'India', privacy:'Review the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025 against the data flow and the commencement date of the relevant provisions. The framework has phased commencement; do not treat every provision as already applicable.', sources:['IN-DPDP','IN-TRADE']},
  uk: {label:'United Kingdom', privacy:'Assess the UK General Data Protection Regulation and Data Protection Act 2018 as amended by the Data (Use and Access) Act 2025. Confirm processing roles, contract terms and any international transfer route with the privacy reviewer.', sources:['UK-DATA']},
  eu: {label:'European Union', privacy:'Assess the territorial and material scope of Regulation (EU) 2016/679, the General Data Protection Regulation. For covered processing, check processor terms and international transfers. Naming Europe alone does not establish EU scope.', sources:['EU-GDPR']},
  germany: {label:'Germany', privacy:'Assess Regulation (EU) 2016/679, the General Data Protection Regulation, and the Federal Data Protection Act (Bundesdatenschutzgesetz, BDSG). Have the privacy reviewer confirm which national provisions and processing roles apply.', sources:['EU-GDPR','DE-BDSG','DE-TRADE','DE-LANGUAGE'], language:'Ask whether German documentation is needed even when the sales discussion is in English.',proof:'Make quality, delivery commitments and local support arrangements explicit in the evaluation pack.'},
  singapore: {label:'Singapore',privacy:'Assess the Personal Data Protection Act 2012 against collection, use, disclosure and the parties\' processing roles. Check the applicable exceptions and transfer requirements with the privacy reviewer.',sources:['SG-PDPA','SG-LANGUAGE'],language:'English is used in Singapore business. Confirm the operating team\'s needs; this does not establish language needs elsewhere in Southeast Asia.'},
  uae: {label:'United Arab Emirates',privacy:'Review Federal Decree Law No. 45 of 2021 Regarding the Protection of Personal Data. Confirm the entity, sector and any free zone regime before deciding which law applies; the federal law is not a blanket conclusion for every UAE entity.',sources:['AE-DATA']},
  saudi: {label:'Saudi Arabia',privacy:'Review the Personal Data Protection Law, its Implementing Regulation and the Regulation on Personal Data Transfer Outside the Kingdom for the actual processing and transfer route.',sources:['SA-DATA']},
  usa: {label:'United States',privacy:'Ask the privacy reviewer to identify the states, sector, data types and processing roles in scope before choosing the applicable laws. A United States label alone does not establish California coverage.',sources:[]},
  california: {label:'California',privacy:'Assess coverage under the California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020. Check the business and data scope before treating its requirements as applicable.',sources:['US-CCPA']}
};

export interface SectorRegionNote { region: RegionId; jurisdiction: string; vertical: VerticalId; text: string; sources: string[] }
// All 54 region and vertical pairs were reviewed. Only sourced differences are populated.
// No note means no additional sector claim, not absence of regulation in that sector.
export const SECTOR_REGION_NOTES: readonly SectorRegionNote[] = [
  {region:'india',jurisdiction:'india',vertical:'fintech',text:'If the buyer and arrangement fall within the Reserve Bank of India (Outsourcing of Information Technology Services) Directions, 2023, ask its risk owner for the supplier due diligence, agreement, continuity and exit evidence needed. A fintech label alone does not establish coverage.',sources:['IN-RBI']},
  {region:'europe',jurisdiction:'germany',vertical:'fintech',text:'For a financial entity and ICT arrangement covered by Regulation (EU) 2022/2554, the Digital Operational Resilience Act (DORA), prepare the service description, contractual responsibilities, continuity and exit evidence with the buyer. Do not describe every fintech supplier as directly supervised under DORA.',sources:['EU-DORA']},
  {region:'europe',jurisdiction:'eu',vertical:'fintech',text:'For a financial entity and ICT arrangement covered by Regulation (EU) 2022/2554, the Digital Operational Resilience Act (DORA), map the proposed contract and service evidence to the buyer\'s review. A general Europe mention does not establish this scope.',sources:['EU-DORA']},
  {region:'united-kingdom',jurisdiction:'uk',vertical:'fintech',text:'Ask the regulated buyer which FCA Senior Management Arrangements, Systems and Controls (SYSC) rules and outsourcing guidance apply to this arrangement. Prepare its risk and operational resilience evidence. Do not treat the new March 2027 reporting requirements as current obligations in this draft.',sources:['UK-FCA']},
  {region:'southeast-asia',jurisdiction:'singapore',vertical:'fintech',text:'For a covered Singapore bank and outsourced relevant service, check MAS Notice 658 and the Guidelines on Outsourcing (Banks) with the bank\'s risk owner. Merchant banks and other financial institutions use different instruments; do not apply the bank notice to every fintech firm.',sources:['SG-MAS']},
  {region:'united-states',jurisdiction:'usa',vertical:'fintech',text:'If the buyer is a financial institution within FTC jurisdiction, check the Standards for Safeguarding Customer Information (FTC Safeguards Rule), including its service provider oversight. Do not assume that every bank or fintech supplier is within FTC jurisdiction.',sources:['US-FTC']},
  {region:'united-states',jurisdiction:'california',vertical:'fintech',text:'If the buyer is a financial institution within FTC jurisdiction, check the Standards for Safeguarding Customer Information (FTC Safeguards Rule). California location alone does not establish that coverage.',sources:['US-FTC']}
];

export const REGION_SOURCES: readonly RegionSource[] = [
  {
    "id": "IN-DPDP",
    "title": "Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025",
    "url": "https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025%3B",
    "published": "2025-11-14; corrigendum 2025-12-16",
    "scope": "India; check phased commencement for the provision and date involved",
    "checked": "2026-11-02"
  },
  {
    "id": "IN-RBI",
    "title": "Reserve Bank of India (Outsourcing of Information Technology Services) Directions, 2023",
    "url": "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12486",
    "published": "2023-04-10",
    "scope": "Only covered regulated entities and outsourcing arrangements; due diligence, agreement, continuity and exit",
    "checked": "2026-11-02"
  },
  {
    "id": "EU-GDPR",
    "title": "Regulation (EU) 2016/679 (General Data Protection Regulation)",
    "url": "https://eur-lex.europa.eu/legal-content/ENG/ALL/?uri=celex%3A32016R0679",
    "published": "2016-04-27",
    "scope": "Territorial and material scope must be checked; processor agreements and international transfers",
    "checked": "2026-11-02"
  },
  {
    "id": "EU-DORA",
    "title": "Regulation (EU) 2022/2554 on digital operational resilience for the financial sector",
    "url": "https://eur-lex.europa.eu/legal-content/ENG/ALL/?uri=CELEX%3A32022R2554",
    "published": "2022-12-14",
    "scope": "Covered financial entities and ICT service arrangements; Article 30 contracts; not every fintech vendor is directly supervised",
    "checked": "2026-11-02"
  },
  {
    "id": "DE-BDSG",
    "title": "Federal Data Protection Act (Bundesdatenschutzgesetz, BDSG)",
    "url": "https://www.bfdi.bund.de/SharedDocs/Downloads/EN/Flyer/Recht-auf-Datenschutz.pdf?__blob=publicationFile&v=3",
    "published": "Publication date not shown in retrieved text",
    "scope": "Germany; BDSG supplements GDPR; exact national provision requires legal review",
    "checked": "2026-11-02"
  },
  {
    "id": "UK-DATA",
    "title": "UK GDPR, Data Protection Act 2018 and Data (Use and Access) Act 2025",
    "url": "https://ico.org.uk/about-the-ico/what-we-do/legislation-we-cover/data-use-and-access-act-2025/the-data-use-and-access-act-2025-what-does-it-mean-for-organisations/",
    "published": "Updated 2026-06-19",
    "scope": "UK; DUAA amends rather than replaces UK GDPR and DPA",
    "checked": "2026-11-02"
  },
  {
    "id": "UK-FCA",
    "title": "FCA outsourcing and operational resilience guidance, including SYSC",
    "url": "https://www.fca.org.uk/firms/outsourcing-and-operational-resilience",
    "published": "Updated 2026-07-14",
    "scope": "Covered firms and relevant arrangements; new March 2027 reporting rules are not current obligations",
    "checked": "2026-11-02"
  },
  {
    "id": "SG-PDPA",
    "title": "Personal Data Protection Act 2012",
    "url": "https://sso.agc.gov.sg/Act/PDPA2012?WholeDoc=1",
    "published": "2020 Revised Edition, operation 2021-12-31",
    "scope": "Singapore; collection, use and disclosure; scope and exceptions matter",
    "checked": "2026-11-02"
  },
  {
    "id": "SG-MAS",
    "title": "MAS Notice 658 and Guidelines on Outsourcing (Banks)",
    "url": "https://www.mas.gov.sg/regulation/third-party-risk-management",
    "published": "2023-12-11; effective 2024-12-11",
    "scope": "Singapore banks; merchant banks and nonbank financial institutions have distinct instruments",
    "checked": "2026-11-02"
  },
  {
    "id": "AE-DATA",
    "title": "Federal Decree Law No. 45 of 2021 Regarding the Protection of Personal Data",
    "url": "https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws",
    "published": "Updated 2025-12-04",
    "scope": "UAE; confirm entity, sector and free zone scope before selecting applicable law",
    "checked": "2026-11-02"
  },
  {
    "id": "SA-DATA",
    "title": "Personal Data Protection Law and its Implementing Regulation; Regulation on Personal Data Transfer Outside the Kingdom",
    "url": "https://sdaia.gov.sa/en/SDAIA/about/Pages/RegulationsAndPolicies.aspx",
    "published": "Publication date not shown in retrieved text",
    "scope": "Saudi Arabia; scope and transfer conditions require review",
    "checked": "2026-11-02"
  },
  {
    "id": "US-FTC",
    "title": "Standards for Safeguarding Customer Information (FTC Safeguards Rule)",
    "url": "https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know",
    "published": "Publication date not shown in retrieved text",
    "scope": "Financial institutions within FTC jurisdiction; not all banks or all fintech vendors",
    "checked": "2026-11-02"
  },
  {
    "id": "US-CCPA",
    "title": "California Consumer Privacy Act of 2018, as amended by the California Privacy Rights Act of 2020",
    "url": "https://oag.ca.gov/privacy/ccpa?rc=novicell",
    "published": "Updated 2026-08-28",
    "scope": "California personal information and covered businesses; not a nationwide rule",
    "checked": "2026-11-02"
  },
  {
    "id": "IN-TRADE",
    "title": "India selling factors and techniques",
    "url": "https://www.trade.gov/country-commercial-guides/india-selling-factors-and-techniques",
    "published": "2026-04-20",
    "scope": "Country guide; linguistic and operational variation; not a prediction of an individual buyer",
    "checked": "2026-11-02"
  },
  {
    "id": "DE-TRADE",
    "title": "Germany selling factors and techniques",
    "url": "https://www.trade.gov/knowledge-product/germany-selling-factors-and-techniques",
    "published": "2025-08-01",
    "scope": "Country guide; documented quality, delivery and support matter in B2B",
    "checked": "2026-11-02"
  },
  {
    "id": "DE-LANGUAGE",
    "title": "Germany business travel",
    "url": "https://www.trade.gov/country-commercial-guides/germany-business-travel",
    "published": "2025-08-01",
    "scope": "German language and English in business; confirm audience rather than infer fluency",
    "checked": "2026-11-02"
  },
  {
    "id": "SG-LANGUAGE",
    "title": "Singapore business travel",
    "url": "https://www.trade.gov/country-commercial-guides/singapore-business-travel",
    "published": "2024-01-05",
    "scope": "English used in business; not a claim about other Southeast Asian countries",
    "checked": "2026-11-02"
  }
];
