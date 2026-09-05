/**
 * ZeenQ EduPresence — Google OAuth 2.0 Service
 * Mengelola otorisasi resmi Google Identity Services (GIS) & Access Token
 */

const STORAGE_KEYS = {
  TOKEN: 'zeenq_google_access_token',
  TOKEN_EXPIRY: 'zeenq_google_token_expiry',
  USER: 'zeenq_google_user',
  CLIENT_ID: 'zeenq_google_client_id'
};

const SYSTEM_CLIENT_ID = '1003005694505-rlisbkc6t34riftuhvl2ecic6lrmimlm.apps.googleusercontent.com';

export function getStoredClientId() {
  return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || SYSTEM_CLIENT_ID;
}

export function setStoredClientId(clientId) {
  if (clientId) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
  }
}

export function getStoredGoogleSession() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);

    if (!token || !userStr) return null;

    // Cek jika token sudah kedaluwarsa (berlaku 1 jam)
    if (expiry && Date.now() > Number(expiry)) {
      clearGoogleSession();
      return null;
    }

    const user = JSON.parse(userStr);
    return { token, user };
  } catch {
    return null;
  }
}

export function saveGoogleSession(user, token, expiresInSeconds = 3500) {
  try {
    const expiry = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiry));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.warn('Gagal menyimpan sesi Google:', e);
  }
}

export function clearGoogleSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Meminta Access Token melalui Google Identity Services (GIS)
 */
export function requestGoogleAccessToken(customClientId) {
  return new Promise((resolve, reject) => {
    const clientId = customClientId || getStoredClientId();

    if (!clientId) {
      reject(new Error('NO_CLIENT_ID'));
      return;
    }

    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services belum termuat. Pastikan Anda terhubung ke internet.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          try {
            const userProfile = await fetchGoogleUserProfile(response.access_token);
            saveGoogleSession(userProfile, response.access_token, response.expires_in || 3599);
            resolve({
              token: response.access_token,
              user: userProfile
            });
          } catch (profileErr) {
            // Tetap resolve dengan user fallback jika profil gagal
            const fallbackUser = {
              name: 'Guru Pengguna',
              email: 'guru@sekolah.id',
              picture: ''
            };
            saveGoogleSession(fallbackUser, response.access_token, response.expires_in || 3599);
            resolve({
              token: response.access_token,
              user: fallbackUser
            });
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Mengambil informasi profil Google pengguna
 */
export async function fetchGoogleUserProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new Error('Gagal mengambil profil akun Google.');
  }

  const data = await res.json();
  return {
    name: data.name || 'Guru Terverifikasi',
    email: data.email || '',
    picture: data.picture || '',
    sub: data.sub || ''
  };
}

/**
 * Mode Demo Cloud: Mensimulasikan akun Google terhubung untuk testing instan
 */
export function simulateDemoLogin() {
  const demoUser = {
    name: 'Bpk. Guru Pengajar (Demo Cloud)',
    email: 'guru.demo@sekolah.id',
    picture: '',
    isDemo: true
  };
  const demoToken = 'demo-google-token-' + Date.now();
  saveGoogleSession(demoUser, demoToken, 86400);
  return { user: demoUser, token: demoToken };
}
