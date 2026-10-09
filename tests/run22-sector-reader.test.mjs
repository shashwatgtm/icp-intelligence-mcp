// Run 22 sector reader job (test first, then the fix). A fresh pool of real companies was read as the wrong sector or the wrong business
// model because of one word: a payments or invoicing word inside a hotel or retail system, a customer bank inside an IT services firm,
// "managed services" inside a database product, "single sign-on" inside a build service, "platform" inside a freight forwarder, a
// software word inside an IoT SIM seller. Every company below is INVENTED and written as a plain description (no real name, page quote or
// figure). The shared reader is the same file in every server; this test file is the same in the five TypeScript repos.
// Run: node --test tests/run22-sector-reader.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

let mod;
try { mod = await import(new URL("../src/verticals.ts", import.meta.url)); } catch { mod = await import(new URL("../netlify/lib/verticals.js", import.meta.url)); }
const { detectVertical, detectModel, explainSector, SUBTYPES } = mod;
const sector = (input) => { const v = detectVertical(input); return v ? v.id : null; };
const model = (input) => detectModel(undefined, input).model;

// [label, reader input, expected sector id (undefined: not pinned), expected business model (null: not pinned)]
const ROWS = [
  // ---- vertical SaaS: software built for one named trade, with money or stock words inside it ----
  ["hotel operating system with built in payments",
    { seller: ["Innkeep is a cloud operating system made for independent hotels and hostels: bookings, front desk, housekeeping, restaurant tills, room pricing and built in card payments (a property management system with point of sale and revenue management)"] }, "vertical-saas", "saas"],
  ["hotel operating system, product named first and payments listed first",
    { seller: ["Stayhub, the operating system built to power modern hotels: it connects reservations, payments, housekeeping and guest messaging in one platform"] }, "vertical-saas", "saas"],
  ["hospitality management system with a long description cut at 'for'",
    { seller: ["Hospitality management system: the operating system for boutique hotels (a cloud property management system with payments in the same system)"] }, "vertical-saas", "saas"],
  ["retail and distribution management package",
    { seller: ["Shelfwise is a retail and distribution management package: billing, stock, purchases, accounting, loyalty and e-invoicing for supermarkets, wholesalers and distributors"] }, "vertical-saas", "saas"],
  ["ERP and POS for retail, restaurants and distribution (text cut at 'for')",
    { seller: ["Omnichannel ERP and POS software for retail, restaurants and distribution: billing, inventory, purchase, accounting, CRM and loyalty, with mobile apps"] }, "vertical-saas", "saas"],
  ["ERP named by trade, with an invoicing feature word",
    { seller: ["Tillbook retail ERP, restaurant ERP and distribution ERP: POS billing that works offline, stock alerts, purchase, accounting with e-invoicing"] }, "vertical-saas", "saas"],
  ["the same retail ERP, product description only in the second text and a stock word in the deal text",
    { seller: ["Omnichannel ERP for retail, restaurants and distribution (retail ERP, restaurant ERP and distribution ERP, with cloud POS)"], context: ["real-time visibility of stock across outlets; most shops run basic billing software and paperwork"] }, "vertical-saas", "saas"],
  ["restaurant point of sale and kitchen software with payments",
    { seller: ["Plateflow is restaurant POS and kitchen display software with online ordering, table payments, stock counts and staff rotas"] }, "vertical-saas", "saas"],
  ["school management software with fee collection",
    { seller: ["Classroll is school management software: admissions, timetables, attendance, parent messages and online fee collection"] }, "vertical-saas", "saas"],
  ["studio management software for gyms",
    { seller: ["Repcount is membership software for gyms and fitness studios: class booking, memberships, door access and card payments"] }, "vertical-saas", "saas"],
  ["hotel system described in pieces (a plan line, a pain, a capability), payments embedded",
    { seller: ["Stayhub go-to-market plan for next quarter.", "Stayhub helps hotels that manage pricing and operations in separate tools: overbookings upset guests and payment reconciliation takes front desk time", "one operating system for the whole property instead of a PMS plus separate tools, with payments embedded so reconciliation and refunds happen in one place"] }, "vertical-saas", "saas"],
  ["retail chain system described in pieces",
    { seller: ["Tillbook for supermarkets and outlets", "billing counters that work offline, SKU level stock alerts, purchase orders, accounting with e-invoicing and loyalty for cashiers"] }, "vertical-saas", "saas"],
  ["membership software for yoga studios and gyms",
    { seller: ["membership and class booking software for yoga studios and gyms"] }, "vertical-saas", "saas"],
  ["childcare centre software with fee billing",
    { seller: ["software for childcare centres: enrolment, attendance, parent messaging and fee billing"] }, "vertical-saas", "saas"],
  ["donor management for nonprofits",
    { seller: ["donor and volunteer management for nonprofits with online giving and receipts"] }, "vertical-saas", "saas"],
  ["CRM built for real estate agents",
    { seller: ["a CRM for real estate agents with listings, leads, e-signatures and commission tracking"] }, "vertical-saas", "saas"],
  ["car rental system with payments",
    { seller: ["rental software for car rental companies: fleet, bookings, damage checks and payments"] }, "vertical-saas", "saas"],
  ["digital transformation consultancy building apps for retail banks",
    { seller: ["a digital transformation consultancy that designs and builds customer apps for retail banks"] }, "ites", "services"],
  ["knowledge process outsourcing for investment banks",
    { seller: ["a knowledge process outsourcing firm providing research and analytics to investment banks"] }, "ites", "services"],
  ["nearshore development company with dedicated teams for fintech startups",
    { seller: ["a nearshore software development company with dedicated teams for fintech startups"] }, "ites", "services"],
  ["deepfake detection for contact centres is security",
    { seller: ["deepfake and impersonation detection for contact centres"] }, "cybersecurity", null],
  ["satellite internet provider",
    { seller: ["a satellite internet provider for ships, mines and remote offices"] }, "telecom", "connectivity"],
  ["crypto exchange and custody",
    { seller: ["a crypto exchange and custody provider for institutions"] }, "fintech", null],
  ["returns management platform for online retailers is logistics",
    { seller: ["a returns management platform for online retailers with labels, drop-off points and refunds"] }, "logistics-tech", "saas"],
  ["applicant tracking is SaaS",
    { seller: ["an applicant tracking and recruiting platform for HR teams"] }, "saas", "saas"],
  ["survey platform is SaaS",
    { seller: ["a customer feedback and survey platform with NPS tracking for product teams"] }, "saas", "saas"],
  // ---- inputs shaped like the tools build them: what it sells, deal text, job titles, segments ----
  ["shaped: technology services firm, segments are payments and banking",
    { seller: ["technology services: digital engineering, data and AI, managed services for payments companies and banks"], context: ["legacy cores and rising regulation in payments and banking"], buyer: ["payments", "finance and banking", "insurance", "telecommunications"] }, "ites", "services"],
  ["shaped: engineering services company, pain text full of KYC and fraud",
    { seller: ["an engineering services company that builds, modernises and runs software for banks, insurers and retailers"], context: ["ageing systems; KYC and AML rules keep changing; fraud losses"], role: ["CTO", "Head of Digital"], buyer: ["banks", "insurers"] }, "ites", "services"],
  ["shaped: AI-native business process services for lenders",
    { seller: ["AI-native business process services for lenders: onboarding, KYC, underwriting support and collections"], context: ["manual KYC reviews; slow loan onboarding"], buyer: ["lenders", "banks"] }, "ites", "services"],
  ["shaped: contact centre company serving telecom operators and banks",
    { seller: ["a contact centre company: voice, chat and back office for telecom operators and banks"], context: ["high churn of agents; rising call volumes"], buyer: ["telecom operators", "banks"] }, "ites", "services"],
  ["shaped: analytics and data engineering services firm, pain text full of fraud and lending",
    { seller: ["an analytics and data engineering services firm"], context: ["fraud analytics, risk models and lending dashboards for banks"], buyer: ["banks", "lenders", "insurers"] }, "ites", "services"],
  ["shaped: finance and accounting outsourcing, work items are accounts payable and receivable",
    { seller: ["finance and accounting outsourcing: accounts payable, accounts receivable and reconciliations run by our teams"], context: ["month-end close takes too long; invoices processed by hand"], buyer: ["mid sized companies"] }, "ites", "services"],
  ["shaped: global capability centre as a service for fintech startups",
    { seller: ["a global capability centre as a service for fintech companies: we hire and run your engineering team in India"], context: ["hiring is slow"], buyer: ["fintech startups"] }, "ites", "services"],
  ["shaped: a lending platform for banks stays fintech",
    { seller: ["a lending platform with loan origination, scoring and collections for banks and NBFCs"], context: ["slow underwriting"], buyer: ["banks"] }, "fintech", null],
  ["shaped: human risk platform whose segments are banks",
    { seller: ["a human risk platform: phishing simulations and security awareness training for employees"], context: ["staff click on phishing emails"], role: ["CISO"], buyer: ["banks", "insurers", "manufacturers"] }, "cybersecurity", "saas"],
  ["shaped: build and test service whose segments include fintech and banks",
    { seller: ["a CI/CD and test automation service for engineering teams"], context: ["slow releases"], role: ["VP Engineering"], buyer: ["fintech", "e-commerce", "gaming", "banks"] }, "software", "saas"],
  ["shaped: digital freight forwarder with a tracking portal",
    { seller: ["a digital freight forwarder: ocean, air and road freight with customs, plus a tracking portal"], context: ["delays and no visibility"], buyer: ["retailers", "manufacturers"] }, "logistics-tech", "services"],
  ["shaped: control tower whose segments include freight forwarders stays a subscription",
    { seller: ["a control tower that gives shippers visibility across carriers"], context: ["no visibility of containers"], buyer: ["retailers", "manufacturers", "freight forwarders"] }, "logistics-tech", "saas"],
  ["shaped: hotel operating system, pain about payment reconciliation",
    { seller: ["the operating system for hotels: PMS, POS, payments and revenue management in one cloud platform"], context: ["payment reconciliation takes time; overbookings"], role: ["General Manager"], buyer: ["independent hotels", "hostels"] }, "vertical-saas", "saas"],
  ["shaped: ERP and billing for supermarkets, restaurants and distributors",
    { seller: ["ERP and billing software for supermarkets, restaurants and wholesale distributors"], context: ["paper billing, stock mismatches"], role: ["business owner"], buyer: ["supermarkets", "restaurants", "distributors"] }, "vertical-saas", "saas"],
  ["express parcel and freight company",
    { seller: ["an express parcel and freight company with warehousing and fulfilment across the country"] }, "logistics-tech", "services"],
  ["professional services firm that designs, builds and runs operations",
    { seller: ["a professional services firm that designs, builds and runs business operations for global clients"] }, "ites", "services"],
  ["cloud communications platform with voice, SMS and video APIs",
    { seller: ["a cloud communications platform with APIs for voice, SMS and video"] }, "telecom", "transactions"],
  ["frontend cloud for deploying web apps",
    { seller: ["a frontend cloud for deploying and previewing web apps"] }, "software", "saas"],
  ["connected workspace for notes, docs and wikis",
    { seller: ["a connected workspace for notes, docs, wikis and projects"] }, "saas", "saas"],
  // ---- any trade, named by a business-type noun (independent auto repair shops, textile mills, growers ...) ----
  ["auto repair shops",
    { seller: ["software for independent auto repair shops: estimates, work orders, parts ordering and customer payments"] }, "vertical-saas", "saas"],
  ["tax professionals",
    { seller: ["tax and accounting software for CPAs and tax professionals: returns, client portal and e-filing"] }, "vertical-saas", "saas"],
  ["municipalities",
    { seller: ["permitting and licensing software for municipalities and local governments"] }, "vertical-saas", "saas"],
  ["solar installers",
    { seller: ["design, quoting and project software for solar installers"] }, "vertical-saas", "saas"],
  ["mills and exporters ERP",
    { seller: ["an ERP for textile mills and garment exporters"] }, "vertical-saas", "saas"],
  ["church management system",
    { seller: ["a church management system with giving, member records and events"] }, "vertical-saas", "saas"],
  ["airline software",
    { seller: ["revenue management and crew scheduling software for airlines"] }, "vertical-saas", "saas"],
  ["bookshop point of sale",
    { seller: ["a platform for independent bookshops and gift stores: inventory, point of sale and online store"] }, "vertical-saas", "saas"],
  ["analytics for game studios stays software or SaaS, not a trade",
    { seller: ["an analytics platform for game studios and app publishers"] }, undefined, "saas"],
  ["CRM for agencies stays SaaS",
    { seller: ["a CRM for agencies and consultancies"] }, "saas", "saas"],
  ["warehouse software for wholesalers and distributors stays logistics",
    { seller: ["warehouse software for wholesalers and distributors"] }, "logistics-tech", null],
  ["cloud security for manufacturers stays cybersecurity",
    { seller: ["cloud security for manufacturers: posture management and threat detection"] }, "cybersecurity", null],
  ["expense management for hotels and restaurants stays fintech",
    { seller: ["expense management for hotels and restaurants"] }, "fintech", null],
  ["offshore development centre for fintech and insurance companies",
    { seller: ["an offshore development centre for fintech and insurance companies"], buyer: ["fintech", "insurance"] }, "ites", "services"],
  ["human annotators for model builders",
    { seller: ["AI training data and human annotators for model builders and autonomous driving teams"], buyer: ["AI labs"] }, "ites", "services"],
  ["AI-powered managed detection and response with bank customers",
    { seller: ["AI-powered managed detection and response with a 24x7 security operations centre"], buyer: ["banks", "payments companies"] }, "cybersecurity", "services"],
  // ---- the same words, but the product IS payments, stock or something else: no change ----
  ["payments platform for restaurants stays fintech",
    { seller: ["Tabpay is a payments platform for restaurants: accept card payments, split bills and pay out to bank accounts"] }, "fintech", null],
  ["warehouse management software for retailers stays logistics",
    { seller: ["Binlane is warehouse management software for retailers: inventory, picking, packing and dispatch"] }, "logistics-tech", null],
  ["billing software for subscription businesses stays SaaS",
    { seller: ["Meterly is billing and invoicing software for subscription businesses with usage-based pricing and revenue recognition"] }, "saas", null],
  ["a security awareness tool for hotels stays cybersecurity",
    { seller: ["Phishguard is phishing simulation and security awareness training for hotel chains and restaurant groups"] }, "cybersecurity", null],
  ["AI agents for hotels stay AI native",
    { seller: ["AI agents that answer guest calls for hotels and book rooms"] }, "ai-native", null],

  // ---- ITeS: a services firm whose clients are banks, payments companies or insurers is still a services firm ----
  ["software engineering services firm with bank clients",
    { seller: ["Brightforge is a software engineering services firm: we design, build and run applications for banks, payments companies and insurers"] }, "ites", "services"],
  ["technology services company that calls its method AI native",
    { seller: ["a digital transformation and technology services company with an AI-native approach to delivery"], context: ["rising regulation in payments and banking; legacy cores; fraud and KYC rules keep changing"] }, "ites", "services"],
  ["managed data services company, clients in banking",
    { seller: ["Datacrew is a data operations and analytics services company: our teams run reporting, data quality and KYC and AML operations for banks and lenders"] }, "ites", "services"],
  ["financial operations outsourcing with crime compliance listed",
    { seller: ["operations, data and customer experience services delivered with AI: financial services operations, financial crime compliance, finance and accounting, data and analytics, technology services"] }, "ites", "services"],
  ["services firm text read together with lending words",
    { seller: ["customer experience (omnichannel support, quality monitoring), financial services operations (trade support, settlements, lending operations, KYC and AML, fraud reviews) delivered by our operations teams"] }, "ites", "services"],
  ["product firm that only sells to banks stays fintech",
    { seller: ["a KYC and AML screening platform for banks, SaaS subscription"] }, "fintech", null],
  ["payments gateway with managed services option stays fintech",
    { seller: ["a payment gateway and payouts API for online businesses, with an optional managed services plan"] }, "fintech", null],
  ["buyer's industry still names the sector when the seller names none (owner decision pending, unchanged)",
    { seller: [""], buyer: ["a customer (banking and payments)"] }, "fintech", null],

  // ---- logistics: a forwarder sells services; its platform is a tool for the customer ----
  ["tech enabled freight forwarder",
    { seller: ["Routewell is a tech enabled freight forwarder: we move freight by ocean, air, road and rail, handle customs and give you a platform for shipment visibility"] }, "logistics-tech", "services"],
  ["digital freight forwarding platform with customs and consolidation",
    { seller: ["Cargolane AI-powered digital freight forwarding platform: ocean, air, road and rail freight; customs support and consolidation services; purchase order tracking and predictive ETAs"] }, "logistics-tech", "services"],
  ["third party logistics provider with a customer portal",
    { seller: ["a third party logistics provider: warehousing, trucking and fulfilment services with a customer portal for orders and tracking"] }, "logistics-tech", "services"],
  ["freight forwarding SOFTWARE stays a subscription",
    { seller: ["Quotelane is freight forwarding software for forwarders: quotes, bookings, documents and invoices, per seat subscription"] }, "logistics-tech", "saas"],
  ["shipment visibility platform stays a subscription",
    { seller: ["a platform that gives shippers visibility of every shipment across carriers, with predictive ETAs and exception alerts"] }, "logistics-tech", "saas"],
  ["shipping software that lists courier services and a 3PL network stays a subscription",
    { seller: ["multi-carrier shipping software for online sellers: compare courier services, print labels, track parcels and use a network of 3PL fulfilment centres; paid plans billed monthly"] }, "logistics-tech", "saas"],

  // ---- software: a build service with an enterprise feature list; a managed database is a product ----
  ["CI/CD service with docker and single sign-on in the feature list",
    { seller: ["Buildloop is a CI/CD service for developers: hosted and self-hosted runners, docker layer caching, flaky test detection, config policies, single sign-on and 24x7 support"] }, "software", "saas"],
  ["feature list only (no category noun), read with the product name",
    { seller: ["Buildloop: Docker, Linux, Windows, macOS and GPU resource classes; self-hosted runners; concurrency on free plans; docker layer caching; flaky test detection; single sign-on; ticket-based support with 24x7 plans"] }, "software", "saas"],
  ["workforce single sign-on product stays cybersecurity",
    { seller: ["single sign-on provider with multi-factor authentication and lifecycle management for workforce identity"] }, "cybersecurity", null],
  ["managed database service is software, not IT services",
    { seller: ["Dataharbor is an open source data platform of fully managed services: PostgreSQL, Kafka and search clusters on any cloud, billed by the hour per service"] }, "software", "saas"],
  ["managed database service for developers",
    { seller: ["a fully managed database service for developers: managed Postgres and MySQL clusters with backups, monitoring and scaling"] }, "software", "saas"],
  ["managed IT services stay IT services",
    { seller: ["managed IT services: service desk, infrastructure management and application support under SLAs, priced per FTE"] }, "ites", "services"],

  // ---- telecom: an IoT SIM seller is connectivity, not hardware ----
  ["IoT SIM seller with software SIM and platform tools",
    { seller: ["a global IoT SIM that connects devices across 600 networks in 150 countries on one profile, as a physical SIM, an eSIM or a software based SIM, with a connectivity platform, an API and network insight tools"] }, "telecom", "connectivity"],
  ["IoT connectivity billed by data used",
    { seller: ["IoT connectivity for fleets of devices: you pay for the data each SIM uses plus a platform fee, with no minimum, and a free trial of five SIMs"] }, "telecom", "connectivity"],
  ["device maker with a dashboard stays hardware plus software",
    { seller: ["we make and ship smart sensors and gateways for cold storage sites, with a dashboard for alerts"] }, undefined, "hardware_software"],
  ["IoT device management software stays a subscription",
    { seller: ["IoT device management software: firmware updates, device groups and dashboards, per device subscription"] }, undefined, "saas"],

  // ---- cybersecurity: the segments named are banks, the product is staff training ----
  ["human risk platform with bank segments",
    { seller: ["a human risk platform that automates phishing simulations and security awareness training for employees"], buyer: ["manufacturers, banks and financial firms, software companies, telecom"] }, "cybersecurity", "saas"],
  ["phishing training priced per employee, used by banks",
    { seller: ["phishing training service for staff, priced per employee, used by banks and insurers"] }, "cybersecurity", null],

  // ---- more trades and more kinds of company, written fresh (not from the fresh pool) ----
  ["law firm practice software with a billing module",
    { seller: ["practice management software for law firms: time tracking, billing and document management"] }, "vertical-saas", "saas"],
  ["dealership system with a financing module",
    { seller: ["dealer management software for car dealerships: stock, service scheduling and financing"] }, "vertical-saas", "saas"],
  ["farm app with a worker payments module",
    { seller: ["a farm management app: field records, input tracking, yield reports and worker payments"] }, "vertical-saas", "saas"],
  ["salon booking and point of sale app with card payments",
    { seller: ["a salon booking and point of sale app with card payments and loyalty"] }, "vertical-saas", "saas"],
  ["ERP for manufacturers",
    { seller: ["ERP for manufacturers: production planning, inventory, procurement and accounting"] }, "vertical-saas", "saas"],
  ["learning management system for schools with fee collection",
    { seller: ["a learning management system for schools and colleges with fee collection"] }, "vertical-saas", "saas"],
  ["invoice financing platform for distributors stays fintech",
    { seller: ["invoice financing platform for distributors and manufacturers"] }, "fintech", null],
  ["investing platform for retail investors stays fintech",
    { seller: ["an investing platform for retail investors with payouts"] }, "fintech", null],
  ["payments app for hotels and restaurants stays fintech",
    { seller: ["a payments app for hotels and restaurants to take card payments and settle to bank accounts"] }, "fintech", null],
  ["delivery app for restaurants stays logistics",
    { seller: ["delivery app for restaurants: dispatch, driver tracking and proof of delivery"] }, "logistics-tech", null],
  ["delivery date promises API is logistics and not a payments seller",
    { seller: ["an API that lets online brands show delivery date promises at checkout and compare carriers"] }, "logistics-tech", "saas"],
  ["courier company with a tracking app sells services",
    { seller: ["a courier company with a tracking app, same day delivery and a business portal"] }, "logistics-tech", "services"],
  ["cloud contact centre software is telecom, not outsourcing",
    { seller: ["a cloud contact centre and business phone system with calling and SMS"] }, "telecom", null],
  ["contact centre outsourcing stays ITeS",
    { seller: ["a contact centre outsourcing company with 2,000 agents handling calls and chat for retailers"] }, "ites", "services"],
  ["password manager is security",
    { seller: ["a password manager and secrets vault for teams"] }, "cybersecurity", null],
  ["operations run by the firm's own analysts for banks",
    { seller: ["we run KYC and AML operations for banks with our own analysts and a case management tool"] }, "ites", "services"],
];

for (const [label, input, wantSector, wantModel] of ROWS) {
  if (wantSector !== undefined) test(`${label}: sector ${wantSector}`, () => {
    assert.equal(sector(input), wantSector, JSON.stringify(input).slice(0, 160));
  });
  if (wantModel) test(`${label}: model ${wantModel}`, () => {
    assert.equal(model(input), wantModel, JSON.stringify(input).slice(0, 160));
  });
}

test("a content distribution platform with payouts is not read as software for a trade", () => {
  assert.notEqual(sector({ seller: ["a content distribution platform for music labels with royalty payouts"] }), "vertical-saas");
});

test("the buyer's industry alone is still read as the buyer's (rule unchanged)", () => {
  const e = explainSector({ seller: [""], buyer: ["a customer (banking and payments)"] });
  assert.equal(e.source, "buyer");
});

test("a vertical SaaS reading names no clinic, pharmacy or healthcare word", () => {
  const v = detectVertical({ seller: ["Innkeep is a cloud operating system made for independent hotels and hostels with built in card payments"] });
  const text = JSON.stringify(v);
  assert.doesNotMatch(text, /\b(?:clinics?|pharmac\w+|patients?|healthcare|hospitals?)\b/i);
});

test("a hotel system and a retail ERP are vertical SaaS of different kinds with different notes", () => {
  const h = detectVertical({ seller: ["Innkeep is a cloud operating system made for independent hotels and hostels: bookings, front desk, housekeeping, restaurant tills and built in card payments"] });
  const r = detectVertical({ seller: ["Omnichannel ERP for retail, restaurants and distribution (retail ERP, restaurant ERP and distribution ERP, with cloud POS)"] });
  assert.equal(h.id, "vertical-saas"); assert.equal(r.id, "vertical-saas");
  assert.equal(h.subtype, "hotel-hospitality");
  assert.equal(r.subtype, "retail-restaurant-ops", "the buyer marker cuts the first phrase; the whole seller text is read for the kind");
  assert.notEqual(JSON.stringify(h.metrics), JSON.stringify(r.metrics));
  assert.match(JSON.stringify(h.buyerRoles), /Revenue Manager|Front Office/);
  assert.doesNotMatch(JSON.stringify(r.buyerRoles), /Revenue Manager|Front Office/);
});

test("a property management system next to hotel words is the hotel kind, and next to leases and tenants stays property management", () => {
  assert.equal(detectVertical({ seller: ["a property management system for hotels with a channel manager and housekeeping"] }).subtype, "hotel-hospitality");
  assert.equal(detectVertical({ seller: ["property management software for landlords: leases, tenants, rent collection and owner statements"] }).subtype, "property-management");
});

test("every committee sentence of a vertical SaaS kind names who signs in the shape the tools parse (one clause ending in 'signs')", () => {
  for (const t of SUBTYPES) {
    if (t.vertical !== "vertical-saas") continue;
    const clauses = t.notes.committee.replace(/\.\s*$/, "").split(/;\s*/);
    assert.ok(clauses.some((c) => /^(.*?)\s+(?:signs?|decides?)$/i.test(c)), `${t.id}: no clause ends in "signs": ${t.notes.committee}`);
    assert.ok(clauses.some((c) => /\bchampions?\b/i.test(c)), `${t.id}: no champion clause`);
  }
});
