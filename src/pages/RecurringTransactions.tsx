import { IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { add } from "ionicons/icons";
import { useState } from "react";
import AddRecurringTransaction from "../components/AddRecurringTransaction";
import "./RecurringTransactions.css";

const RecurringTransactions: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Pagos recurrentes</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir categorías */}
                    <IonFabButton color="medium" className="add-recurring-transaction-fab-button" onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir pagos recurrentes */}
                <AddRecurringTransaction isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddRecurringTransaction>
            </IonContent>
        </IonPage>
    );
}

export default RecurringTransactions;