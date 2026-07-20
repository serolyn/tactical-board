import { useEffect, useRef } from "react";
import {
  useAnimate,
  useInView,
  useReducedMotion,
} from "motion/react";

import rose from "../../../assets/effects/music/Rose.png";
import crow from "../../../assets/effects/music/Crow.png";
import arrow from "../../../assets/effects/music/Arrow.png";
import Nuages from "../../../assets/effects/music/Nuages.png";

import "./music-story-overlay.css";

export function MusicStoryOverlay() {
  // Toutes les animations lancées avec "animate" restent limitées à cette scène.
  const [scope, animate] = useAnimate();

  // La scène commence lorsqu'elle devient visible à l'écran.
  const isVisible = useInView(scope, {
    once: true,
    amount: 0.4,
  });

  // Empêche la séquence de se lancer plusieurs fois.
  const hasPlayed = useRef(false);

  // Désactive les mouvements importants si l'utilisateur le demande.
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isVisible || hasPlayed.current) {
      return;
    }

    hasPlayed.current = true;

    async function playScene() {
      /*
       * Version accessible : la rose et le corbeau apparaissent simplement.
       * La flèche n'est pas animée.
       */
      if (reducedMotion) {
        await Promise.all([
          animate(".rose", { opacity: 1 }, { duration: 0.2 }),
          animate(".crow", { opacity: 1 }, { duration: 0.2 }),
        ]);

        return;
      }

      /*
       * ÉTAPE 1 — Apparition de la rose.
       */
      await animate(
        ".rose",
        {
          opacity: [0, 1],
          y: [100, 0],
          scale: [0.88, 1],
          filter: [
            "blur(12px) brightness(0.7)",
            "blur(0px) brightness(1)",
          ],
        },
        {
          duration: 1.1,
          ease: [0.22, 1, 0.36, 1],
        },
      );

      /*
       * La rose commence un mouvement lent qui continue en arrière-plan.
       * On ne met pas "await", car cette animation est infinie.
       */
      void animate(
        ".rose",
        {
          y: [0, -7, 0],
          rotate: [-0.6, 0.6, -0.6],
          filter: [
            "brightness(1) drop-shadow(0 0 12px rgba(207,75,70,0.2))",
            "brightness(1.15) drop-shadow(0 0 25px rgba(207,75,70,0.45))",
            "brightness(1) drop-shadow(0 0 12px rgba(207,75,70,0.2))",
          ],
        },
        {
          duration: 5.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        },
      );
      void animate(  //nuages ---------------------------------------
        ".Nuages",
        {
          opacity: [1, 0.5,0],
          x: [-430, 430],
          y: [50, 0],
          rotate: [-5, 0],
          scale: [0.95, 1],
          filter: [
            "blur(14px) brightness(0.85)",
            "blur(0px) brightness(1)",
          ],
        },
        {
          duration: 15.25,
          ease: [0.22, 1, 0.36, 1],
        },
      );
      
      /*
       * ÉTAPE 2 — Le corbeau apparaît à côté de la rose.
       */
      await animate(
        ".crow",
        {
          opacity: [0.8, 1],
          x: [-130, 0],
          y: [50, 0],
          rotate: [-5, 0],
          scale: [0.78, 1],
          filter: [
            "blur(14px) brightness(0.55)",
            "blur(0px) brightness(1)",
          ],
        },
        {
          duration: 1.25,
          ease: [0.22, 1, 0.36, 1],
        },
      );


      /*
       * Petite respiration du corbeau avant l'impact.
       * Elle sert également de pause dramatique.
       */
      await animate(
        ".crow",
        {
          y: [0, -6, 0],
          rotate: [0, -1.2, 0],
        },
        {
          duration: 3.2,
          ease: "easeInOut",
        },
      );
    

      /*
       * ÉTAPE 3 — La flèche traverse l'écran.
       *
       * Sa position CSS représente sa destination finale.
       * Ici elle commence très loin à gauche, puis termine à x = 0.
       */
      await animate(
        ".arrow-flight",
        {
          opacity: [0, 1, 0],
          x: ["-60vw", "-8vw", "0vw"],
          y: [18, 2, 0],
          rotate: [-6, -1, 0],
          filter: ["blur(6px)", "blur(1px)", "blur(0px)"],
        },
        {
          duration: 1.72,
          times: [0, 0.86, 1],
          ease: "easeIn",
        },
      );

      /*
       * ÉTAPE 4 — Impact.
       *
       * Le corbeau tremble, s'illumine brièvement en rouge et l'onde
       * d'impact grandit au milieu de son corps.
       */
      await Promise.all([
        animate(
          ".crow",
          {
            x: [0, 18, -13, 9, -5, 0],
            y: [0, 5, -2, 3, 0],
            rotate: [0, 3, -2, 1.2, 0],
            filter: [
              "brightness(1)",
              "brightness(2) saturate(1.5) drop-shadow(0 0 30px rgba(207,75,70,0.95))",
              "brightness(0.8) saturate(0.85) drop-shadow(0 0 12px rgba(207,75,70,0.3))",
            ],
          },
          {
            duration: 0.58,
            ease: "easeOut",
          },
        ),

        animate(
          ".crow-impact",
          {
            opacity: [0, 1, 0.7, 0],
            scale: [0.15, 1, 1.8, 2.6],
          },
          {
            duration: 0.7,
            ease: "easeOut",
          },
        ),
      ]);

      

      /*
       * Après l'impact, le corbeau reste légèrement instable.
       * La flèche demeure dans sa position finale.
       */

      
      await animate(
        ".crow",
        {
          x: [0, 8, 22],
          y: [0, 28, 120, 260],
          rotate: [0, 8, 24, 70],
          opacity: [1, 1, 0.92, 0.78],
          filter: [
            "brightness(1)",
            "brightness(0.95)",
            "brightness(0.88)",
          ],
        },
        {
          duration: 1.25,
          ease: "easeIn",
          times: [0, 0.2, 0.55, 1],
        },
      );
    }

    void playScene();
  }, [animate, isVisible, reducedMotion]);

  return (
    <div ref={scope} className="music-story" aria-hidden="true">
      <div className="music-story__rose-position">
        <img
          className="music-story__asset rose"
          src={rose}
          alt=""
          draggable={false}
        />
      </div>

      <div className="music-story__nuages-position">
        <img
          className="music-story__asset Nuages"
          src={Nuages}
          alt=""
          draggable={false}
        />
      </div>

      {/*
       * La flèche est placée derrière le corbeau.
       * Les pixels opaques du corbeau cachent son centre, mais sa pointe et
       * son extrémité restent visibles : cela simule la traversée du corps.
       */}
      <div className="arrow-flight">
        <img
          className="music-story__asset arrow"
          src={arrow}
          alt=""
          draggable={false}
        />
      </div>

      <div className="music-story__crow-position">
        <img
          className="music-story__asset crow"
          src={crow}
          alt=""
          draggable={false}
        />

        <span className="crow-impact" />
      </div>
    </div>
  );
}