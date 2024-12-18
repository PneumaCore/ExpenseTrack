import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import { chevronBack } from "ionicons/icons";
import "./EditAccount.css";

interface EditAccountProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account | null;
}

interface Account {
    account_id: string,
    user_id: string,
    name: string,
    currency: string,
    balance: number,
    icon: string,
    color: string
}

const EditAccount: React.FC<EditAccountProps> = ({ isOpen, onClose, account }) => {

    const handleSaveAccount = async () => {
        null;
    }

    const handleDeleteAccount = async () => {
        null;
    }

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Editar cuenta</IonTitle>
                    <IonButton slot="start" onClick={onClose} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>

            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <div className='edit-account-footer'>

                        {/* Botón para editar la categoría */}
                        <IonButton onClick={handleSaveAccount}>Guardar cuenta</IonButton>

                        {/* Botón para eliminar la cuenta */}
                        <IonButton className='handle-delete-account-button' color='danger' onClick={handleDeleteAccount}>Eliminar cuenta</IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonModal>
    );
}

export default EditAccount;