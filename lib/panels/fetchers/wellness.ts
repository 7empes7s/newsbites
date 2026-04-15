export async function fetchFDAAlerts(term: string) {
  const encoded = encodeURIComponent(term);
  const res = await fetch(
    `https://api.fda.gov/drug/enforcement.json?search=status:"Ongoing"+AND+reason_for_recall:"${encoded}"&limit=5`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWHONews() {
  const res = await fetch(
    'https://www.who.int/api/news/newsitems?sf_culture=en&$top=5&$orderby=PublicationDateAndTime desc',
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchClinicalTrialCount(condition: string) {
  const encoded = encodeURIComponent(condition);
  const res = await fetch(
    `https://clinicaltrials.gov/api/v2/studies?query.cond=${encoded}&countTotal=true&pageSize=0`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  return res.json();
}