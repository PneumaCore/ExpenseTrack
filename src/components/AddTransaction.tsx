import React from 'react';
import { IonContent, IonHeader, IonModal, IonToolbar, IonTitle, IonButton } from '@ionic/react';
import './AddTransaction.css';

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ isOpen, onClose }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Añadir transacción</IonTitle>
          <IonButton slot="end" onClick={onClose}>
            Cerrar
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>

      </IonContent>
    </IonModal>
  );
};

export default AddTransaction;
