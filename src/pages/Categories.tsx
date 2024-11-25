import { IonButton, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { add, chevronBack } from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router";
import AddCategory from "../components/AddCategory";
import "./Categories.css";

const Categories: React.FC = () => {
    const history = useHistory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Categorías</IonTitle>
                    <IonButton slot="start" onClick={() => history.goBack()} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir categorías */}
                    <IonFabButton onClick={() => setIsModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir categorías */}
                <AddCategory isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}></AddCategory>
            </IonContent>
        </IonPage>
    );
}

export default Categories;