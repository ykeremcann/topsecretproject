import fetch from "node-fetch";

const API_URL = "http://localhost:5000/api";

const verifyDelete = async () => {
    try {
        // 1. Login as Admin
        console.log("Logging in as admin...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@test.com",
                password: "password123"
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message);
        const token = loginData.accessToken;
        console.log("Admin logged in");

        // 2. Create a dummy user to delete
        console.log("Creating dummy user...");
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "todelete",
                email: "todelete@test.com",
                password: "password123",
                firstName: "To",
                lastName: "Delete",
                role: "patient",
                dateOfBirth: "1990-01-01"
            })
        });

        const registerData = await registerRes.json();
        // If user already exists, that's fine, we'll get their ID from login or search, 
        // but for simplicity let's assume we can login if register fails
        let userId;
        if (registerRes.ok) {
            userId = registerData.user.id;
            console.log("Dummy user created:", userId);
        } else {
            console.log("User might exist, trying to login to get ID...");
            const loginUserRes = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "todelete@test.com",
                    password: "password123"
                })
            });
            const loginUserData = await loginUserRes.json();
            if (!loginUserRes.ok) throw new Error("Could not get dummy user ID");
            userId = loginUserData.user.id;
            console.log("Dummy user ID retrieved:", userId);
        }

        // 3. Delete the user
        console.log("Deleting user...");
        const deleteRes = await fetch(`${API_URL}/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const deleteData = await deleteRes.json();
        if (!deleteRes.ok) throw new Error(deleteData.message);
        console.log("Delete response:", deleteData);

        // 4. Verify deletion
        console.log("Verifying deletion...");
        const checkRes = await fetch(`${API_URL}/users/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (checkRes.status === 404) {
            console.log("SUCCESS: User not found (404) as expected.");
        } else {
            console.error("FAILURE: User still exists or other error.", await checkRes.json());
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

verifyDelete();
