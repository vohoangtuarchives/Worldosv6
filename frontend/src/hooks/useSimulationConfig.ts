'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';

export type SimulationValue = string | number | boolean | null;

export interface SimulationSetting {
    id?: number;
    key: string;
    value: SimulationValue;
    group: string;
    description?: string;
}

export interface GroupedSettings {
    general: SimulationSetting[];
    physics: SimulationSetting[];
    simulation: SimulationSetting[];
    psychology: SimulationSetting[];
    entropy: SimulationSetting[];
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useSimulationConfig() {
    const { data: settings, error, mutate, isLoading } = useSWR<GroupedSettings>(
        '/simulation/settings',
        fetcher
    );

    const updateSettings = async (payload: SimulationSetting[]) => {
        try {
            await api.post('/simulation/settings/update', { settings: payload });
            toast.success('Simulation protocols updated.');
            await mutate();
        } catch (err) {
            toast.error('Failed to update simulation protocols.');
            throw err;
        }
    };

    const resetSettings = async (group?: string) => {
        try {
            await api.post('/simulation/settings/reset', { group });
            toast.success('Simulation protocols reset to defaults.');
            await mutate();
        } catch (err) {
            toast.error('Failed to reset simulation protocols.');
            throw err;
        }
    };

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        resetSettings,
        refresh: mutate
    };
}
