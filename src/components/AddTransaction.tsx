import React, { useState } from 'react';
import { IonContent, IonHeader, IonModal, IonToolbar, IonTitle, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonGrid, IonRow, IonCol, IonItem, IonInput, IonPopover, IonDatetime, IonTextarea } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { database } from '../configurations/firebase';
import { calendar, chevronBack } from 'ionicons/icons';
import './AddTransaction.css';

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ isOpen, onClose }) => {
  const [transactionType, setTransactionType] = useState('income');
  const [amount, setAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [note, setNote] = useState('');

  /* Guardamos la fecha en el formato por defecto */
  const handleDateChange = (e: CustomEvent) => {
    setSelectedDate(e.detail.value!);
    setDatePickerOpen(false);
  };

  /* Guardamos la transacción en la base de datos */
  const handleSaveTransaction = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("El usuario no ha iniciado sesión");
      return;
    }

    try {

      /* Pasamos la fecha a Timestamp, ya que así la acepta Firebase */
      const dateObject = new Date(selectedDate);
      const dateTimestamp = Timestamp.fromDate(dateObject);

      await addDoc(collection(database, 'transactions'), {
        uid: currentUser.uid,
        type: transactionType,
        amount: amount,
        date: dateTimestamp,
        note: note
      });
      onClose();
    } catch (error) {
      console.error("Error al añadir la transacción:", error);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Añadir transacción</IonTitle>
          <IonButton slot="start" onClick={onClose} fill='clear'>
            <IonIcon icon={chevronBack}></IonIcon>
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonSegment value={transactionType} onIonChange={(e: CustomEvent) => setTransactionType(e.detail.value)}>
          <IonSegmentButton value="income">
            <IonLabel>Ingreso</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="expense">
            <IonLabel>Gasto</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        {transactionType === 'income' ? (
          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonChange={(e) => setAmount(parseFloat(e.detail.value!))} required />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Fecha' labelPlacement='floating' placeholder='Fecha' readonly value={selectedDate}></IonInput>

                  {/* Abrir el popover para seleccionar la fecha de la transacción */}
                  <IonIcon slot='end' icon={calendar} onClick={() => setDatePickerOpen(true)}></IonIcon>
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonTextarea label='Nota' labelPlacement='floating' placeholder='Nota' value={note} onIonChange={(e) => setNote(e.detail.value!)}></IonTextarea>
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton onClick={handleSaveTransaction}>Guardar transacción</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        ) : (
          <IonGrid>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonChange={(e) => setAmount(parseFloat(e.detail.value!))} required />
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Fecha' labelPlacement='floating' placeholder='Fecha' readonly value={selectedDate}></IonInput>

                  {/* Abrir el popover para seleccionar la fecha de la transacción */}
                  <IonIcon slot='end' icon={calendar} onClick={() => setDatePickerOpen(true)}></IonIcon>
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonTextarea label='Nota' labelPlacement='floating' placeholder='Nota' value={note} onIonChange={(e) => setNote(e.detail.value!)}></IonTextarea>
                </IonItem>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton onClick={handleSaveTransaction}>Guardar transacción</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}

        {/* Popover para seleccionar la fecha de la transacción */}
        {/* Cerrar el popover para seleccionar la fecha de la transacción */}
        <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
          <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} />
          <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
        </IonPopover>
      </IonContent>
    </IonModal>
  );
};

export default AddTransaction;
