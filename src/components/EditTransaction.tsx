import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { Timestamp } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import './EditTransaction.css';

interface EditTransactionProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

interface Transaction {
    transaction_id: string,
    user_id: string,
    type: string,
    category_id: string,
    account_id: string,
    amount: number,
    currency: string,
    date: Timestamp,
    note: string,
    created_at: Timestamp
}

const EditTransaction: React.FC<EditTransactionProps> = ({ isOpen, onClose, transaction }) => {

    const handleSaveTransaction = async () => {
        null;
    }

    const handleDeleteTransaction = async () => {
        null;
    }
    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar transacción</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>

                </IonContent>
                <IonFooter>
                    <IonToolbar>
                        <div className='add-transaction-footer'>

                            {/* Botón para guardar la transacción */}
                            <IonButton onClick={handleSaveTransaction}>Guardar transacción</IonButton>

                            {/* Botón para eliminar la cuenta */}
                            <IonButton className='handle-delete-transaction-button' color='danger' onClick={handleDeleteTransaction}>Eliminar transacción</IonButton>
                        </div>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
        </>
    );
}

export default EditTransaction;