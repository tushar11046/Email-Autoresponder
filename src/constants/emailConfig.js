export const labelCategories = [
    "Interested",
    "Not Interested",
    "Need more Information",
    "Human Intervention Required",
];

let excludeQuery = "";

export function getExcludeQuery() {

    if (excludeQuery !== "") return excludeQuery;

    for (const label of labelCategories) {
        excludeQuery += ` -label:${label}`;
    }

    return excludeQuery;
}

excludeQuery = excludeQuery.trim();