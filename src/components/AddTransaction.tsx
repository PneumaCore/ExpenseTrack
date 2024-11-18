import { IonButton, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { calendar, chevronBack } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './AddTransaction.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ isOpen, onClose }) => {
  const [transactionType, setTransactionType] = useState('gasto');
  const [amount, setAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  /* Leemos las categorías de las transacciones de la base de datos */
  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(database, 'categories'));
      const categoriesList: Category[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesList);
    };

    fetchCategories();
  }, []);

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

      /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
      const dateObject = new Date(selectedDate);
      const dateTimestamp = Timestamp.fromDate(dateObject);

      await addDoc(collection(database, 'transactions'), {
        user_id: currentUser.uid,
        type: transactionType,
        amount: amount,
        category_id: selectedCategory,
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

        {/* Seleccionamos el tipo de transacción */}
        <IonSegment value={transactionType} onIonChange={(e: CustomEvent) => setTransactionType(e.detail.value)}>
          <IonSegmentButton value="gasto">
            <IonLabel>Gasto</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ingreso">
            <IonLabel>Ingreso</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Pantalla para los gastos */}
        {transactionType === 'gasto' ? (
          <IonGrid>

            {/* Campo para añadir el monto de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonChange={(e) => setAmount(parseFloat(e.detail.value!))} required />
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para seleccionar la categoría de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonSelect interface='popover' label='Categoría' labelPlacement='floating' placeholder="Selecciona una categoría" value={selectedCategory} onIonChange={(e) => setSelectedCategory(e.detail.value)}>
                    {categories
                      .filter(category => category.type === transactionType)
                      .map(category => (
                        <IonSelectOption key={category.id} value={category.id}>
                          {category.name}
                        </IonSelectOption>
                      ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para seleccionar la fecha de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Fecha' labelPlacement='floating' placeholder='Selecciona una fecha' readonly value={selectedDate}></IonInput>

                  {/* Abrir el popover para seleccionar la fecha de la transacción */}
                  <IonIcon slot='end' icon={calendar} onClick={() => setDatePickerOpen(true)}></IonIcon>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para añadir una nota o descripción de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' value={note} onIonChange={(e) => setNote(e.detail.value!)}></IonTextarea>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Botón para guardar la transacción */}
            <IonRow>
              <IonCol>
                <IonButton expand='full' onClick={handleSaveTransaction}>Guardar transacción</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        ) : (
          null
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
