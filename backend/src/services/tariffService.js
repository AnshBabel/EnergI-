import TariffConfig from '../models/TariffConfig.js';
import { generateMockData } from '../utils/mockData.js';

export const getActiveTariff = async (organizationId) => {
  const tariff = await TariffConfig.findOne({ organizationId, isActive: true });
  if (!tariff) throw Object.assign(new Error('No active tariff configuration found'), { status: 404 });
  return tariff;
};

export const createTariff = async (organizationId, data) => {
  // Deactivate existing active tariff if setting new one as active
  if (data.isActive) {
    await TariffConfig.updateMany({ organizationId, isActive: true }, { isActive: false });
  }
  return TariffConfig.create({ ...data, organizationId });
};

export const setActiveTariff = async (organizationId, tariffId) => {
  const tariff = await TariffConfig.findOne({ _id: tariffId, organizationId });
  if (!tariff) throw Object.assign(new Error('Tariff not found'), { status: 404 });

  await TariffConfig.updateMany({ organizationId, isActive: true }, { isActive: false });
  tariff.isActive = true;
  await tariff.save();
  return tariff;
};

export const listTariffs = async (organizationId, { forceDemo = false } = {}) => {
  if (forceDemo) {
    const { tariffs } = generateMockData(organizationId);
    return tariffs;
  }
  return TariffConfig.find({ organizationId }).sort({ effectiveFrom: -1 });
};


export const deleteTariff = async (organizationId, tariffId) => {
  const tariff = await TariffConfig.findOne({ _id: tariffId, organizationId });
  if (!tariff) throw Object.assign(new Error('Tariff not found'), { status: 404 });
  if (tariff.isActive) throw Object.assign(new Error('Cannot delete active tariff'), { status: 400 });
  await tariff.deleteOne();
};
