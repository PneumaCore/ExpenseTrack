import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faDollarSign, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButton, IonCol, IonContent, IonFab, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import React, { useState } from 'react';
import { database } from '../configurations/firebase';
import './AddCategory.css';
import GlobalToast from './GlobalToast';


interface AddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const icons: { gasto: IconDefinition[]; ingreso: IconDefinition[] } = {
  gasto: [
    faHome, faLightbulb, faTools, faGasPump, faBus, faWrench, faCar,
    faShoppingCart, faUtensils, faBriefcaseMedical, faPills, faUserMd,
    faFilm, faMusic, faPuzzlePiece, faGraduationCap, faBook, faChalkboardTeacher,
    faCreditCard, faMoneyBillWave, faPiggyBank, faChartLine, faGift,
    faHandHoldingHeart, faShoppingBag
  ],
  ingreso: [
    faBriefcase, faHandHoldingUsd, faLaptop, faShoppingBasket, faCoins,
    faChartBar, faBuilding, faGift, faSyncAlt, faTrophy, faReceipt
  ]
};

type CategoryType = keyof typeof icons;

const colors = [
  '#395659', '#99BFBF', '#BAD9D9', '#F2BB77', '#D9AB82', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
  '#955251', '#B565A7', '#009B77', '#DD4124', '#D65076', '#45B8AC', '#EFC050', '#5B5EA6', '#FFB3BA', '#FFDFBA',
  '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C0C0C0', '#FFD700', '#40E0D0', '#FF69B4', '#8A2BE2', '#00CED1', '#FF4500'
];

const AddCategory: React.FC<AddCategoryProps> = ({ isOpen, onClose }) => {
  const [error, setError] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [type, setType] = useState<CategoryType>('gasto');
  const [name, setName] = useState('');
  const [mensualBudget, setMensualBudget] = useState(0);
  const [icon, setIcon] = useState(faQuestion);
  const [color, setColor] = useState('#A9A9A9');

  /* Notificación global */
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, message: '', type: 'error' });

  const handleSaveCategory = async () => {

    /* Validamos que los datos sean válidos */
    if (!name) {
      setError('Introduce un nombre válido para la categoría');
      setShowAlert(true);
      return;
    }

    if (mensualBudget < 0) {
      setError('Introduce un presupuesto mensual válido para la categoría');
      setShowAlert(true);
      return;
    }

    if (icon === faQuestion) {
      setError('Selecciona un icono para la categoría');
      setShowAlert(true);
      return;
    }

    if (color === '#A9A9A9') {
      setError('Selecciona un color para la categoría');
      setShowAlert(true);
      return;
    }

    try {

      /* Obtenemos los datos del usuario autenticado */
      const auth = getAuth();
      const currentUser = auth.currentUser;

      /* Generamos un ID automático con Firestore */
      const categoriesRef = doc(collection(database, 'categories'));
      const categoryId = categoriesRef.id;

      const newCategory = {
        category_id: categoryId,
        user_id: currentUser?.uid,
        name: name,
        mensualBudget: mensualBudget,
        type: type,
        icon: icon.iconName,
        color: color
      }

      /* Guardamos la categoría en la base de datos */
      await setDoc(categoriesRef, newCategory);

      setToastConfig({ isOpen: true, message: 'Categoría añadida con éxito', type: 'success' });

      /* Cerramos el modal automáticamente al guardar la categoría */
      onClose();

    } catch (error) {
      setToastConfig({ isOpen: true, message: 'No se pudo añadir la categoría', type: 'error' });
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Añadir categoría</IonTitle>
            <IonButton slot="start" onClick={onClose} fill='clear'>
              <IonIcon icon={chevronBack}></IonIcon>
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Datos inválidos'} message={error} buttons={['Aceptar']} />)}

          {/* Seleccionamos el tipo de categoría */}
          <IonSegment value={type} onIonChange={(e: CustomEvent) => { setType(e.detail.value); setName(''); setIcon(faDollarSign); setColor('#000000'); }}>
            <IonSegmentButton value="gasto">
              <IonLabel>Gasto</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ingreso">
              <IonLabel>Ingreso</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonGrid>

            {/* Campo para añadir el nombre de la categoría */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonInput={(e) => setName(e.detail.value!)} required />
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para añadir el presupuesto mensual de la categoría */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <IonInput label='Presupuesto mensual' labelPlacement='floating' placeholder='Presupuesto mensual' type='number' value={mensualBudget} onIonInput={(e) => setMensualBudget(parseFloat(e.detail.value!))} required />
                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para la selección de icono de la categoría */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <div className="icon-picker-container">
                    <IonLabel>Selecciona un icono</IonLabel>
                    <div>
                      {icons[type].map((faIcon, index) => (
                        <div
                          key={index}
                          onClick={() => setIcon(faIcon)}
                          className={`icon-container ${icon === faIcon ? 'selected' : ''}`}
                        >
                          <FontAwesomeIcon icon={faIcon} />
                        </div>
                      ))}
                    </div>
                  </div>

                </IonItem>
              </IonCol>
            </IonRow>

            {/* Campo para la selección de color de la categoría */}
            <IonRow>
              <IonCol size="12" size-md="8" offset-md="2">
                <IonItem>
                  <div className="color-picker-container">
                    <IonLabel>Selecciona un color</IonLabel>
                    <div>
                      {colors.map((colorOption, index) => (
                        <div
                          key={index}
                          onClick={() => setColor(colorOption)}
                          className={`color-container ${color === colorOption ? 'selected' : ''}`}
                          style={{ backgroundColor: colorOption }}
                        />
                      ))}
                    </div>
                  </div>
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonFab slot="fixed" vertical="bottom" horizontal="center">
            <div>

              {/* Botón para guardar la categoría */}
              <IonButton color={"medium"} shape='round' onClick={handleSaveCategory}>Añadir</IonButton>
            </div>
          </IonFab>
        </IonContent>
      </IonModal>
      <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
    </>
  );
};

export default AddCategory;
