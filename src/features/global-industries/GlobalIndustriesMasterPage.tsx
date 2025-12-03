import React, { useState, Suspense } from 'react';
import { SharedLayout } from './components/SharedLayout';
import { GalaxyView } from './components/GalaxyView';
import { DepartmentMapView } from './components/DepartmentMapView';
import { DependenciesFlowView } from './components/DependenciesFlowView';
import { ReadinessView } from './components/ReadinessView';
import { AIScenariosView } from './components/AIScenariosView';
import LoadingScreen from '../../ui/LoadingScreen';

const GlobalIndustriesMasterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('galaxy');

    return (
        <SharedLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <Suspense fallback={<LoadingScreen />}>
                {activeTab === 'galaxy' && <GalaxyView />}
                {activeTab === 'departments' && <DepartmentMapView />}
                {activeTab === 'dependencies' && <DependenciesFlowView />}
                {activeTab === 'readiness' && <ReadinessView />}
                {activeTab === 'scenarios' && <AIScenariosView />}
            </Suspense>
        </SharedLayout>
    );
};

export default GlobalIndustriesMasterPage;
