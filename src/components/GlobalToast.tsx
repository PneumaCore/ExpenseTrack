import { IonToast } from '@ionic/react';
import { checkmark, closeOutline } from 'ionicons/icons';
import './GlobalToast.css';

interface GlobalToastProps {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
    onDidDismiss?: () => void;
}

const GlobalToast: React.FC<GlobalToastProps> = ({ isOpen, message, type, onDidDismiss }) => {
    const icon = type === "success" ? checkmark : closeOutline;
    const color = type === "success" ? "success" : "danger";
    return (
        <IonToast isOpen={isOpen} position="top" message={message} duration={3000} icon={icon} color={color} onDidDismiss={onDidDismiss}></IonToast>
    );
}

export default GlobalToast;