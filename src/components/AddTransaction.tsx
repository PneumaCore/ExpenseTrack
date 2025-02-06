import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonAlert, IonButton, IonCol, IonContent, IonDatetime, IonFab, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import ImageCompression from 'browser-image-compression';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, or, query, runTransaction, Timestamp, where } from 'firebase/firestore';
import { addOutline, calendar, chevronBack, closeCircle } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './AddTransaction.css';
import GlobalToast from './GlobalToast';

interface Account {
  account_id: string,
  user_id: string,
  name: string,
  currency: string,
  balance: number,
  icon: string,
  color: string
}

interface Category {
  category_id: string,
  user_id: string,
  name: string,
  mensualBudget: number,
  type: string,
  icon: string,
  color: string
}

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ isOpen, onClose }) => {
  const [error, setError] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [type, setType] = useState('gasto');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
  const [amount, setAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [images, setImages] = useState<string[]>([]);

  /* Notificación global */
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, message: '', type: 'error' });

  /* Leemos las cuentas asociadas al usuario de la base de datos */
  useEffect(() => {
    const fetchAccounts = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado */
        const accountsRef = collection(database, 'accounts');
        const q = query(accountsRef, where('user_id', '==', currentUser?.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedAccounts = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            account_id: doc.id,
          })) as Account[];
          setAccounts(fetchedAccounts);
        });
        return unsubscribe;

      } catch (error) {
        console.error("Error al obtener las transacciones: ", error);
      }
    };
    const unsubscribe = fetchAccounts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /* Filtramos las categorías según el tipo de la transacción */
  const filteredCategories = categories.filter(category => category.type === type);

  /* Leemos las categorías de las transacciones de la base de datos */
  useEffect(() => {
    const fetchCategories = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado y los globales */
        const categoriesRef = collection(database, 'categories');
        const q = query(
          categoriesRef,
          or(
            where('user_id', '==', currentUser?.uid),
            where('user_id', '==', null)
          )
        );

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

  /* Seleccionamos las fotos haciendo una foto con la cámara o escogiéndolas de la galería */
  const handlePhoto = async () => {
    if (images.length >= 5) {
      setToastConfig({ isOpen: true, message: 'No puedes añadir más de 5 imágenes', type: 'error' });
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        quality: 75,
      });

      if (photo?.webPath) {
        const imageBlob = await fetch(photo.webPath).then(res => res.blob());
        const fileName = "transaction-photo.jpg";
        const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };

        const compressedImage = await ImageCompression(imageFile, options);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Image = reader.result as string;
          setImages(prevImages => [...prevImages, base64Image]);
        };
        reader.readAsDataURL(compressedImage);
      }
    } catch (error) {
      console.error('Error al obtener o comprimir la foto:', error);
    }
  };

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  /* Guardamos la transacción en la base de datos */
  const handleSaveTransaction = async () => {

    /* Validamos que los datos sean válidos */
    if (!selectedAccount) {
      setError('Selecciona una cuenta para la transacción');
      setShowAlert(true);
      return;
    }

    if (amount <= 0) {
      setError('Introduce un monto válido para la transacción');
      setShowAlert(true);
      return;
    }

    if (!selectedCategory) {
      setError('Selecciona una categoría para la transacción');
      setShowAlert(true);
      return;
    }

    if (!selectedDate) {
      setError('Selecciona una fecha para la transacción');
      setShowAlert(true);
      return;
    }

    try {

      /* Obtenemos los datos del usuario autenticado */
      const auth = getAuth();
      const currentUser = auth.currentUser;

      /* Generamos un ID automático con Firestore */
      const transactionsRef = doc(collection(database, 'transactions'));
      const transactionId = transactionsRef.id;

      /* Buscamos la cuenta seleccionada, para posteriormente acceder a su id y su divisa */
      const account = accounts.find((acc) => acc.account_id === selectedAccount);
      if (!account) {
        setToastConfig({ isOpen: true, message: 'La cuenta seleccionada no es válida', type: 'error' });
        return;
      }

      /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
      const dateObject = new Date(selectedDate);
      const dateTimestamp = Timestamp.fromDate(dateObject);

      const newTransaction = {
        transaction_id: transactionId,
        user_id: currentUser?.uid,
        type: type,
        category_id: selectedCategory,
        account_id: account.account_id,
        amount: parseFloat(amount.toFixed(2)),
        currency: account.currency,
        date: dateTimestamp,
        note: note,
        image: images
      }

      /* Buscamos la referencia en la base de datos de la cuenta seleccionada */
      const accountRef = doc(database, 'accounts', account.account_id);

      /* Guardamos la transacción en la base de datos y actualizamos el balance de la cuenta utilizada en la transacción */
      await runTransaction(database, async (transaction) => {
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error('La cuenta seleccionada no existe.');
        }

        /* Obtenemos el balance actual de la cuenta */
        const currentBalance = accountDoc.data().balance;

        /* Calculamos el nuevo balance según si la transacción es de tipo gasto o ingreso */
        const newBalance = type === 'gasto'
          ? Number(currentBalance) - Number(amount)
          : Number(currentBalance) + Number(amount);

        /* Actualizamos el balance de la cuenta en la base de datos */
        transaction.update(accountRef, { balance: newBalance });

        /* Guardamos la transacción en la base de datos */
        transaction.set(transactionsRef, newTransaction);
      });

      setToastConfig({ isOpen: true, message: 'Transacción añadida con éxito', type: 'success' });

      /* Cerramos el modal automáticamente al guardar la transacción */
      onClose();
    } catch (error) {
      setToastConfig({ isOpen: true, message: 'No se pudo añadir la transacción', type: 'error' });
    }
  };

  return (
    <>
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
          {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Datos inválidos'} message={error} buttons={['Aceptar']} />)}

          {/* Seleccionamos el tipo de transacción */}
          <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
            <IonSegmentButton value="gasto">
              <IonLabel>Gasto</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ingreso">
              <IonLabel>Ingreso</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonGrid>

            {/* Campo para seleccionar la cuenta de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonSelect interface="popover" label="Cuenta" labelPlacement="floating" placeholder="Selecciona una cuenta" value={selectedAccount} onIonChange={(e) => setSelectedAccount(e.detail.value)}>
                    {accounts.map(account => (
                      <IonSelectOption key={account.account_id} value={account.account_id}>
                        <IonLabel>{account.name} ({account.balance.toFixed(2)} {account.currency})</IonLabel>
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para añadir el monto de la transacción */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonInput={(e) => setAmount(parseFloat(e.detail.value!))} required />
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>

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
                <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' value={note} onIonInput={(e) => setNote(e.detail.value!)}></IonTextarea>
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Campo añadir fotos de la cámara o galería */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <div className="image-container">
                {images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image} alt={`Imagen ${index + 1}`} />
                    <IonIcon icon={closeCircle} className="close-icon" onClick={() => removeImage(index)} />
                  </div>
                ))}
                {images.length < 5 && (
                  <div className="add-image-button" onClick={handlePhoto}>
                    <IonIcon icon={addOutline} />
                  </div>
                )}
              </div>
            </IonCol>
          </IonRow>

          {/* Popover para seleccionar la fecha de la transacción */}
          {/* Cerrar el popover para seleccionar la fecha de la transacción */}
          <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
            <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} max={new Date().toISOString().split('T')[0]} />
            <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
          </IonPopover>
          <IonFab slot="fixed" vertical="bottom" horizontal="center">
            <div>

              {/* Botón para guardar la transacción */}
              <IonButton className='add-transaction-fab-button' color={"medium"} shape='round' onClick={handleSaveTransaction}>Añadir</IonButton>
            </div>
          </IonFab>
        </IonContent>
      </IonModal>
      <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
    </>
  );
};

export default AddTransaction;
