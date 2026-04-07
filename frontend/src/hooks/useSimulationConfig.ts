'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useSimulationConfig() {
    const queryClient = useQueryClient();

    const { data: settings, error, isLoading } = useQuery<GroupedSettings>({
        queryKey: ['simulation', 'settings'],
        queryFn: () => api.get('/simulation/settings').then((res) => res.data),
    });

    const updateSettings = async (payload: SimulationSetting[]) => {
        try {
            await api.post('/simulation/settings/update', { settings: payload });
            toast.success('Simulation protocols updated.');
            await queryClient.invalidateQueries({ queryKey: ['simulation', 'settings'] });
        } catch (err) {
            toast.error('Failed to update simulation protocols.');
            throw err;
        }
    };

    const resetSettings = async (group?: string) => {
        try {
            await api.post('/simulation/settings/reset', { group });
            toast.success('Simulation protocols reset to defaults.');
            await queryClient.invalidateQueries({ queryKey: ['simulation', 'settings'] });
        } catch (err) {
            toast.error('Failed to reset simulation protocols.');
            throw err;
        }
    };

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['simulation', 'settings'] });

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        resetSettings,
        refresh
    };
}
