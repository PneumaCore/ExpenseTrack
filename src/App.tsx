import {
  IonApp, IonIcon, IonLabel, IonLoading, IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs, setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { diamond, ellipse, square, triangle } from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';
import LogIn from './pages/LogIn';
import SignUp from './pages/SignUp';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import SideMenu from './components/SideMenu';
import { auth } from './configurations/firebase';
import Categories from './pages/Categories';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  /* Se comprueba que haya un usuario autenticado en la aplicación */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* Mientras se comprueba la autenticación del usuario, se le informa mediante un aviso de carga */
  if (isAuthenticated === null) {
    return <IonLoading isOpen={true} message={'Verificando autenticación...'} />;
  }

  return (
    <IonApp>
      <IonReactRouter>

        {/* Si el usuario está autenticado, aparecerá el menú deslizante solamente en el menú principal de la aplicación */}
        {isAuthenticated && <SideMenu />}

        {/* Si el usuario no está autenticado, se le redirige a la pantalla de inicio de sesión, si lo está, le lleva al menú principal de la aplicación */}
        <IonRouterOutlet id="main-content">
          {!isAuthenticated ? (
            <>
              <Route exact path="/signup" component={SignUp} />
              <Route exact path="/" render={() => <Redirect to="/login" />} />
              <Route exact path="/login" component={LogIn} />
            </>
          ) : (
            <>

              {/* Rutas para la botonera principal de la aplicación */}
              <IonTabs>
                <IonRouterOutlet>
                  <Route exact path="/tab1" component={Tab1} />
                  <Route exact path="/tab2" component={Tab2} />
                  <Route path="/tab3" component={Tab3} />
                  <Route path="/tab4" component={Tab4} />
                  <Route exact path="/" render={() => <Redirect to="/tab1" />} />
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                  <IonTabButton tab="tab1" href="/tab1">
                    <IonIcon aria-hidden="true" icon={triangle} />
                    <IonLabel>Tab 1</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="tab2" href="/tab2">
                    <IonIcon aria-hidden="true" icon={ellipse} />
                    <IonLabel>Tab 2</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="tab3" href="/tab3">
                    <IonIcon aria-hidden="true" icon={square} />
                    <IonLabel>Tab 3</IonLabel>
                  </IonTabButton>
                  <IonTabButton tab="tab4" href="/tab4">
                    <IonIcon aria-hidden="true" icon={diamond} />
                    <IonLabel>Tab 4</IonLabel>
                  </IonTabButton>
                </IonTabBar>
              </IonTabs>
              <Route exact path="/login" component={LogIn} />

              {/* Rutas independientes */}
              <Route path="/categories" component={Categories} />
            </>
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
