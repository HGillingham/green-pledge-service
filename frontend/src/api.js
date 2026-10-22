const API_URL = import.meta.env.VITE_API_URL;

// One helper that every request goes through
async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    // a 204 (No Content) has no JSON to read
    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {

        // API sends { error } for validation (400) and server errors (500),
        // and { message } for not found (404)

        const message =
            data?.error || data?.message || `Request failed (${response.status})`;
        throw new Error(message);
    }

    return data;
}

export const getAllPledges = () => request("/pledges");

export const getPledge = (id) => request(`/pledges/${id}`);

export const createPledge = (pledge) => 
    request("/pledges", { method: "POST", body: JSON.stringify(pledge) });

export const updatePledge = (id, pledge) => 
    request(`/pledges/${id}`, { method: "PUT", body: JSON.stringify(pledge) });

export const deletePledge = (id) =>
    request(`/pledges/${id}`, { method: "DELETE" });