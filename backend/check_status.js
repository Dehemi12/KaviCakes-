async function main() {
    const url = "https://kjoojbvbugfxkhjiqlun.supabase.co/storage/v1/object/public/cakes/site_1771247485509.jpeg";
    try {
        console.log("Checking URL:", url);
        const res = await fetch(url, { method: 'HEAD' });
        console.log("Status:", res.status, res.statusText);
        // Supabase returns 404 for object not found even if public.
        // If 403, then permission denied.
    } catch (e) {
        console.log("Error:", e.message);
    }
}
main();
