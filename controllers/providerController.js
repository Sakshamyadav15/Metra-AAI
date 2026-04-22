import { getProviderSettings, testProviderConnectivity } from "../services/providerConfigService.js";

export function getProviders(_req, res) {
  const data = getProviderSettings();
  return res.json(data);
}

export async function postProviderTest(req, res) {
  try {
    const provider = req.body?.provider;
    const result = await testProviderConnectivity(provider);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error?.response?.data?.error?.message || error.message,
    });
  }
}
