import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faDollarSign, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
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

const AddCategory: React.FC<AddCategoryProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState('gasto');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(faHome);
  const [color, setColor] = useState('#000000');

  /* Notificación global */
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, message: '', type: 'error' });

  const handleSaveCategory = async () => {
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

          {/* Seleccionamos el tipo de categoría */}
          <IonSegment value={type} onIonChange={(e: CustomEvent) => { setType(e.detail.value); setName(''); setIcon(faDollarSign); setColor('#000000'); }}>
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

              {/* Campo para añadir el nombre de la categoría */}
              <IonRow>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonItem>
                    <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
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
                        {[
                          faHome,
                          faLightbulb,
                          faTools,
                          faGasPump,
                          faBus,
                          faWrench,
                          faCar,
                          faShoppingCart,
                          faUtensils,
                          faBriefcaseMedical,
                          faPills,
                          faUserMd,
                          faFilm,
                          faMusic,
                          faPuzzlePiece,
                          faGraduationCap,
                          faBook,
                          faChalkboardTeacher,
                          faCreditCard,
                          faMoneyBillWave,
                          faPiggyBank,
                          faChartLine,
                          faGift,
                          faHandHoldingHeart,
                          faShoppingBag
                        ].map((faIcon, index) => (
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
                        {['#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e', '#00bcd4', '#8bc34a'].map(
                          (colorOption, index) => (
                            <div
                              key={index}
                              onClick={() => setColor(colorOption)}
                              className={`color-container ${color === colorOption ? 'selected' : ''
                                }`}
                              style={{ backgroundColor: colorOption }}
                            />
                          )
                        )}
                      </div>
                    </div>

                  </IonItem>
                </IonCol>
              </IonRow>

              {/* Botón para guardar la categoría */}
              <IonRow>
                <IonCol>
                  <IonButton expand='full' onClick={handleSaveCategory}>Guardar categoría</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          ) : (
            <IonGrid>

              {/* Campo para añadir el nombre de la categoría */}
              <IonRow>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonItem>
                    <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
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
                        {[
                          faBriefcase,
                          faHandHoldingUsd,
                          faLaptop,
                          faShoppingBasket,
                          faCoins,
                          faChartBar,
                          faBuilding,
                          faGift,
                          faSyncAlt,
                          faTrophy,
                          faReceipt
                        ].map((faIcon, index) => (
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
                        {['#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e', '#00bcd4', '#8bc34a'].map(
                          (colorOption, index) => (
                            <div
                              key={index}
                              onClick={() => setColor(colorOption)}
                              className={`color-container ${color === colorOption ? 'selected' : ''
                                }`}
                              style={{ backgroundColor: colorOption }}
                            />
                          )
                        )}
                      </div>
                    </div>

                  </IonItem>
                </IonCol>
              </IonRow>

              {/* Botón para guardar la categoría */}
              <IonRow>
                <IonCol>
                  <IonButton className='handle-category-button' expand='full' onClick={handleSaveCategory}>Guardar categoría</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}
        </IonContent>
      </IonModal>
      <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
    </>
  );
};

export default AddCategory;
