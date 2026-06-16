function setMessage(text, type = 'ok') {
    const el = document.getElementById('profileMessage');
    el.textContent = text;
    el.className = `profile-message ${type}`;
    el.style.display = 'block';
}

async function loadProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await API.getUser(user.id);
        const profile = res.user;

        document.getElementById('username').value = profile.username || '';
        document.getElementById('email').value = profile.email || '';

        const prefs = profile.preferences || {};
        document.getElementById('defaultMode').value = (prefs.default_travel_mode || 'DRIVE').toLowerCase();
        document.getElementById('avoidTolls').checked = !!prefs.avoid_tolls;
        document.getElementById('avoidHighways').checked = !!prefs.avoid_highways;

        document.getElementById('profileName').textContent = profile.username || 'User';
        document.getElementById('profileEmail').textContent = profile.email || '';

        setCurrentUser({
            ...user,
            username: profile.username,
            email: profile.email,
            preferences: profile.preferences || {}
        });
    } catch (err) {
        setMessage(`Could not load profile: ${err.message}`, 'error');
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();

    if (!username || !email) {
        setMessage('Username and email are required', 'error');
        return;
    }

    try {
        const res = await API.updateUser(user.id, username, email);
        setCurrentUser({
            ...user,
            username: res.user.username,
            email: res.user.email,
            preferences: res.user.preferences || user.preferences || {}
        });
        document.getElementById('profileName').textContent = res.user.username;
        document.getElementById('profileEmail').textContent = res.user.email;
        setMessage('Profile updated successfully', 'ok');
    } catch (err) {
        setMessage(`Profile update failed: ${err.message}`, 'error');
    }
}

async function savePreferences(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    const preferences = {
        default_travel_mode: (document.getElementById('defaultMode').value || 'driving').toUpperCase(),
        avoid_tolls: document.getElementById('avoidTolls').checked,
        avoid_highways: document.getElementById('avoidHighways').checked
    };

    try {
        await API.updatePreferences(user.id, preferences);
        setCurrentUser({
            ...user,
            preferences
        });
        setMessage('Preferences updated successfully', 'ok');
    } catch (err) {
        setMessage(`Preferences update failed: ${err.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user?.username) {
        document.getElementById('welcomeUser').textContent = `Profile, ${user.username}`;
    }

    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('preferencesForm').addEventListener('submit', savePreferences);
    loadProfile();
});
