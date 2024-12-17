import { IonButton, IonCol, IonContent, IonDatetime, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPopover, IonRow, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, runTransaction, Timestamp, where } from 'firebase/firestore';
import { addOutline, calendar, chevronBack, closeCircle } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import ImageCompression from 'browser-image-compression';
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
  const [amount, setAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  /* Guardamos la dirección de la imagen */
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

    /* Almacenamos las imagenes de la galería del usuario */
    const files = event.target.files;
    if (files) {

      /* Pasamos la lista de imágenes a un array */
      const newImages = Array.from(files);

      /* Impedimos que el usuario introduzca más de cinco imágenes, ya que realmente no son necesarias tantas */
      if (images.length + newImages.length > 5) {
        setToastConfig({ isOpen: true, message: 'No puedes añadir más de cinco fotos', type: 'error' });
        return;
      }

      /* Comprimimos todas las imágenes */
      const compressedImages = await Promise.all(
        newImages.map(async (image) => {
          const compressedImage = await compressImage(image);
          return compressedImage;
        })
      );

      /* Generamos las URL para las vistas previas */
      const newPreviews = compressedImages.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...compressedImages]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  /* Funcionalidad para eliminar una fotos que el usuario ha cargado de la galería */
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /* Funcionalidad para comprimir la imagen */
  const compressImage = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await ImageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir la imagen:', error);
      return file;
    }
  };

  /* Funcionalidad para convertir una imagen a base64 */
  const handleImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
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

      /* Buscamos la cuenta seleccionada, para posteriormente acceder a su id y su divisa */
      const account = accounts.find((acc) => acc.account_id === selectedAccount);
      if (!account) {
        setToastConfig({ isOpen: true, message: 'La cuenta seleccionada no es válida', type: 'error' });
        return;
      }

      /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
      const dateObject = new Date(selectedDate);
      const dateTimestamp = Timestamp.fromDate(dateObject);

      /* Pasamos todas las imágenes a base64 */
      const imageBase64List = await Promise.all(
        images.map((image) =>
          handleImageToBase64(image)
        )
      );

      const newTransaction = {
        transaction_id: transactionId,
        user_id: currentUser?.uid,
        type: type,
        category_id: selectedCategory,
        account_id: account.account_id,
        amount: amount,
        currency: account.currency,
        date: dateTimestamp,
        note: note,
        image: imageBase64List
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
                        {account.name}
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
                  <IonInput label='Monto' labelPlacement='floating' placeholder='Monto' type="number" value={amount} onIonChange={(e) => setAmount(parseFloat(e.detail.value!))} required />
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
                <IonTextarea label='Nota' labelPlacement='floating' placeholder='Introduce una descripción' value={note} onIonChange={(e) => setNote(e.detail.value!)}></IonTextarea>
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Campo añadir foto de la galería */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <div className="image-container">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="image-preview">
                    <img src={src} alt={`preview-${index}`} />
                    <IonIcon icon={closeCircle} className="close-icon" onClick={() => removeImage(index)} />
                  </div>
                ))}
                {images.length < 5 && (
                  <label htmlFor="upload-photo" className="add-image-button">
                    <IonIcon icon={addOutline} />
                    <input id="upload-photo" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </IonCol>
          </IonRow>

          {/* Popover para seleccionar la fecha de la transacción */}
          {/* Cerrar el popover para seleccionar la fecha de la transacción */}
          <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
            <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} />
            <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
          </IonPopover>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <div className='add-transaction-footer'>

              {/* Botón para guardar la transacción */}
              <IonButton onClick={handleSaveTransaction}>Guardar transacción</IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonModal>
      <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
    </>
  );
};

export default AddTransaction;
