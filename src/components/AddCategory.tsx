import { faCar, faDollarSign, faHome, faPlus, faShoppingCart, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';
import React, { useState } from 'react';
import './AddCategory.css';

interface AddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCategory: React.FC<AddCategoryProps> = ({ isOpen, onClose }) => {
  const [categoryType, setCategoryType] = useState('gasto');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(faDollarSign);
  const [color, setColor] = useState('#000000');

  return (
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
        <IonSegment value={categoryType} onIonChange={(e: CustomEvent) => setCategoryType(e.detail.value)}>
          <IonSegmentButton value="gasto">
            <IonLabel>Gasto</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ingreso">
            <IonLabel>Ingreso</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Pantalla para los gastos */}
        {categoryType === 'gasto' ? (
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
                        faPlus,
                        faDollarSign,
                        faHome,
                        faWallet,
                        faCar,
                        faShoppingCart,
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
                      {['#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1'].map(
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
                <IonButton expand='full'>Guardar categoría</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        ) : (
          <IonGrid>

          </IonGrid>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AddCategory;