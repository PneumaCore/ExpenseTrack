import { IonButton, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { calendar, chevronBack } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './AddTransaction.css';

interface Category {
  category_id: string,
  user_id: string,
  name: string,
  type: string,
  icon: string,
  color: string
}

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  {/* Filtramos las categorías según el tipo de la transacción */ }
  const filteredCategories = categories.filter(category => category.type === type);

  /* Leemos las categorías de las transacciones de la base de datos */
  useEffect(() => {
    const fetchCategories = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado */
        const categoriesRef = collection(database, 'categories');
        const q = query(categoriesRef, where('user_id', '==', currentUser?.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedCategories = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            category_id: doc.id,
          })) as Category[];
          setCategories(fetchedCategories);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error al obtener las categorías: ", error);
      }
    };
    const unsubscribe = fetchCategories();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /* Guardamos la fecha en el formato por defecto */
  const handleDateChange = (e: CustomEvent) => {
    setSelectedDate(e.detail.value!);
    setDatePickerOpen(false);
  };

  /* Guardamos la transacción en la base de datos */
  const handleSaveTransaction = async () => {

    try {

      /* Obtenemos los datos del usuario autenticado */
      const auth = getAuth();
      const currentUser = auth.currentUser;

      /* Generamos un ID automático con Firestore */
      const transactionsRef = doc(collection(database, 'transactions'));
      const transactionId = transactionsRef.id;

      /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
      const dateObject = new Date(selectedDate);
      const dateTimestamp = Timestamp.fromDate(dateObject);

      const newTransaction = {
        transaction_id: transactionId,
        user_id: currentUser?.uid,
        type: type,
        category_id: selectedCategory,
        account_id: null,
        amount: amount,
        currency: null,
        date: dateTimestamp,
        note: note,
        created_at: null
      }

      /* Guardamos la transacción en la base de datos */
      await setDoc(transactionsRef, newTransaction);
    } catch (error) {
      console.error("Error al añadir la transacción:", error);
    }

    /* Cerramos el modal automáticamente al guardar la transacción */
    onClose();
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
        <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
          <IonSegmentButton value="gasto">
            <IonLabel>Gasto</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ingreso">
            <IonLabel>Ingreso</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Pantalla para los gastos */}
        {type === 'gasto' ? (
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
                  <IonSelect interface="popover" label="Categoría" labelPlacement="floating" placeholder="Selecciona una categoría" value={selectedCategory} onIonChange={(e) => setSelectedCategory(e.detail.value)}>
                    {filteredCategories.map(category => (
                      <IonSelectOption key={category.category_id} value={category.category_id}>
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
          <IonGrid>
            {/* Pantalla para los ingresos */}
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
                  <IonSelect interface="popover" label="Categoría" labelPlacement="floating" placeholder="Selecciona una categoría" value={selectedCategory} onIonChange={(e) => setSelectedCategory(e.detail.value)}>
                    {filteredCategories.map(category => (
                      <IonSelectOption key={category.category_id} value={category.category_id}>
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
