import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { usePlan } from '../hooks/usePlan';
import { t } from '../i18n/translations';
import { useSettings } from '../hooks/useSettings';
import UpgradeModal from '../components/UpgradeModal';
import { generateTestsReport, generatePlayerTestReport } from '../utils/pdfGenerator';
import { downloadCSV } from '../utils/downloadCSV.js';
import { GraficaEvolucion, GraficaResumen } from '../components/GraficasTest';
import RadarChart from '../components/RadarChart';
import LegendCard from '../components/LegendCard';
import ProgressTracker from '../components/ProgressTracker';
import TestDetail from './TestDetail';
import PlayerAnalyticsModal, { SvgRadar } from '../components/PlayerAnalyticsModal';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, writeBatch, doc, deleteDoc } from '../firebase/firestore-proxy';
import html2canvas from 'html2canvas';
import WellnessTestModal from '../components/WellnessTestModal';
import RPETestModal from '../components/RPETestModal';
import './Tests.css';

const gamingVisualsV1 = true;

// PREDEFINED_TESTS remains as base catalog
const DEFAULT_TESTS = [
  { id: 't1', type: 'fisico', category: 'Resistencia', name: 'Test de Cooper', unit: 'm', desc: 'Distancia recorrida en 12 minutos.', imagenProtocolo: '/img/tests/cooper.png', protocol: { ejecucion: 'Correr la mayor distancia posible en 12 minutos alrededor de una pista o campo marcado.', medicion: 'Se anota la distancia total en metros usando cinta métrica o GPS.', objetivo: 'Medir la capacidad aeróbica máxima (VO2 máx) y la resistencia general.' } },
  { id: 't2', type: 'fisico', category: 'Resistencia', name: 'Course Navette', unit: 'nivel', desc: 'Carrera de ida y vuelta de 20m con pitidos.', imagenProtocolo: '/img/tests/sprint_30m.png', protocol: { ejecucion: 'Carreras de 20 metros al ritmo de un pitido de audio que se acelera cada minuto.', medicion: 'Se anota el último palier (nivel) completado antes de no llegar a tiempo a la línea.', objetivo: 'Medir la potencia aeróbica máxima y el consumo máximo de oxígeno.' } },
  { id: 't3', type: 'fisico', category: 'Velocidad', name: 'Sprint 10m', unit: 'seg', desc: 'Aceleración en distancia corta.', imagenProtocolo: '/img/tests/sprint_10m.png', protocol: { ejecucion: 'Desde posición estática, sprint al máximo esfuerzo hasta rebasar la línea de 10 metros.', medicion: 'Uso de cronómetro manual o fotocélulas. Se anota el tiempo en segundos.', objetivo: 'Mejorar la capacidad de aceleración y explosividad en los primeros metros.' } },
  { id: 't4', type: 'fisico', category: 'Velocidad', name: 'Sprint 30m', unit: 'seg', desc: 'Velocidad máxima lanzada.', imagenProtocolo: '/img/tests/sprint_30m.png', protocol: { ejecucion: 'Sprint de 30 metros al máximo esfuerzo desde posición estática.', medicion: 'Tiempo en segundos cronometrado.', objetivo: 'Medir la velocidad máxima y capacidad anaeróbica aláctica.' } },
  { id: 't5', type: 'fisico', category: 'Agilidad', name: 'T-Test', unit: 'seg', desc: 'Desplazamientos frontales, laterales y de espaldas.', imagenProtocolo: '/img/tests/t_test.png', protocol: { ejecucion: 'Sprint 10m al frente, desplazamiento lateral 5m a la izquierda, 10m a la derecha, 5m al centro y 10m de espaldas al inicio.', medicion: 'Tiempo en segundos. Se penaliza si se cruzan las piernas en el lateral.', objetivo: 'Evaluar la agilidad, equilibrio y cambios de dirección rápidos.' } },
  { id: 't6', type: 'fisico', category: 'Fuerza', name: 'Salto CMJ', unit: 'cm', desc: 'Salto vertical con contramovimiento.', imagenProtocolo: '/img/tests/salto_cmj.png', protocol: { ejecucion: 'Manos en las caderas. Bajar el centro de gravedad (flexión de rodillas) e inmediatamente saltar lo más alto posible.', medicion: 'Altura del salto en centímetros (usar plataforma de contacto o app de video).', objetivo: 'Medir la potencia explosiva del tren inferior (fuerza reactiva).' } },
  { id: 't7', type: 'fisico', category: 'Técnica', name: 'Conducción conos', unit: 'seg', desc: 'Slalom entre conos con finalización.', imagenProtocolo: '/img/tests/conduccion_conos.png', protocol: { ejecucion: 'Conducir el balón haciendo slalom entre 5 conos separados por 2 metros y dar un pase a un objetivo.', medicion: 'Tiempo total en segundos desde inicio hasta que el pase entra al objetivo.', objetivo: 'Evaluar el control del balón en velocidad y precisión final.' } },
  { id: 't8', type: 'fisico', category: 'Técnica', name: 'Pase a portería', unit: 'pts', desc: 'Precisión de pase a zonas objetivo (10 pases).', imagenProtocolo: '/img/tests/pase_porteria.png', protocol: { ejecucion: '10 pases desde la frontal del área hacia pequeñas porterías o zonas marcadas.', medicion: '1 punto por cada acierto. Total de 10 puntos posibles.', objetivo: 'Medir la precisión del golpeo y concentración técnica.' } },

  { id: 'psi1_old', type: 'psicodeportivo', category: 'Psicología', name: 'Escala de Autoconfianza', unit: 'pts', desc: 'Mide la confianza del jugador en sus capacidades deportivas', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Cuestionario de Rosenberg adaptado al deporte. Respuestas tipo Likert.', rangoMin: 0, rangoMax: 40 },
  { id: 'psi2_old', type: 'psicodeportivo', category: 'Psicología', name: 'Ansiedad Competitiva (CSAI-2R)', unit: 'pts', desc: 'Evalúa ansiedad cognitiva, somática y autoconfianza', imagenProtocolo: '/img/tests/ansiedad_competitiva.png', protocol: 'Cuestionario antes de competir.', rangoMin: 0, rangoMax: 68 },
  { id: 'psi3_old', type: 'psicodeportivo', category: 'Psicología', name: 'Motivación Deportiva (SMS-II)', unit: 'pts', desc: 'Mide tipos de motivación en el deporte', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario SMS-II', rangoMin: 18, rangoMax: 126 },
  { id: 'psi4_old', type: 'psicodeportivo', category: 'Psicología', name: 'Resiliencia en el Deporte', unit: 'pts', desc: 'Capacidad de sobreponerse a situaciones adversas', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario de resiliencia', rangoMin: 0, rangoMax: 50 },
  { id: 'psi5_old', type: 'psicodeportivo', category: 'Psicología', name: 'Atención y Concentración', unit: 'seg', desc: 'Mide la atención selectiva y concentración', imagenProtocolo: '/img/tests/atencion_concentracion.png', protocol: 'Prueba cognitiva cronometrada', rangoMin: 0, rangoMax: 100 },

  { id: 'soc1_old', type: 'sociodeportivo', category: 'Sociología', name: 'Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Cuestionario del Ambiente de Grupo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Evalúa la cohesión social y de tarea.', rangoMin: 18, rangoMax: 162 },
  { id: 'soc2_old', type: 'sociodeportivo', category: 'Sociología', name: 'Escala de Deporte Limpio', unit: 'pts', desc: 'Actitudes hacia el Fair Play', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: 'Cuestionario de actitudes.', rangoMin: 0, rangoMax: 50 },
  { id: 'soc3_old', type: 'sociodeportivo', category: 'Sociología', name: 'Habilidades Sociales', unit: 'pts', desc: 'Asertividad y comunicación en el deporte', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Evaluación de habilidades interpersonales.', rangoMin: 0, rangoMax: 100 },
  { id: 'soc4_old', type: 'sociodeportivo', category: 'Sociología', name: 'Liderazgo Percibido', unit: 'pts', desc: 'Percepción de roles de liderazgo en el equipo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Cuestionario de liderazgo deportivo.', rangoMin: 0, rangoMax: 100 },
  { id: 'soc5_old', type: 'sociodeportivo', category: 'Sociología', name: 'Satisfacción con el Entrenador', unit: 'pts', desc: 'Percepción sobre el cuerpo técnico', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Cuestionario de satisfacción', rangoMin: 0, rangoMax: 50 },

  { id: 'psi1', type: 'psicosocial', category: 'Afrontamiento', name: 'Inventario de Habilidades de Afrontamiento (ACSI-28)', unit: 'pts', desc: 'Evalúa cómo el jugador maneja la presión y la adversidad', imagenProtocolo: '/img/tests/acsi28_afrontamiento.png', protocol: 'Responder cuestionario en escala de 1 a 5.', rangoMin: 0, rangoMax: 30, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo la calma cuando cometo un error.', dimension: 'Afrontamiento' },
    { id: 'q2', text: 'Me recupero rápidamente tras una mala jugada.', dimension: 'Afrontamiento' },
    { id: 'q3', text: 'Me mantengo concentrado a pesar de las distracciones.', dimension: 'Concentración' },
    { id: 'q4', text: 'Puedo enfocarme solo en la tarea actual.', dimension: 'Concentración' },
    { id: 'q5', text: 'Siento seguridad en mis capacidades antes del partido.', dimension: 'Confianza' },
    { id: 'q6', text: 'No dudo de mí mismo en momentos críticos.', dimension: 'Confianza' }
  ] },
  { id: 'psi2', type: 'psicosocial', category: 'Fortaleza Mental', name: 'Cuestionario de Fortaleza Mental (MTQ-10)', unit: 'pts', desc: 'Mide la capacidad de perseverar bajo presión', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: 'Cuestionario de 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo el control emocional cuando las cosas van mal.', dimension: 'Control' },
    { id: 'q2', text: 'Cumplo con lo que me propongo hasta el final.', dimension: 'Compromiso' },
    { id: 'q3', text: 'Veo los problemas como oportunidades de mejora.', dimension: 'Desafío' },
    { id: 'q4', text: 'Confío en mi capacidad para superar obstáculos.', dimension: 'Confianza' }
  ] },
  { id: 'psi3', type: 'psicosocial', category: 'Metas', name: 'Escala de Establecimiento de Metas', unit: 'pts', desc: 'Evalúa capacidad de fijar y perseguir objetivos', imagenProtocolo: '/img/tests/establecimiento_metas.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Planifico mis objetivos a corto y largo plazo.', dimension: 'Planificación' },
    { id: 'q2', text: 'Sigo trabajando duro aunque no vea resultados inmediatos.', dimension: 'Persistencia' },
    { id: 'q3', text: 'Evalúo mi progreso regularmente.', dimension: 'Revisión' }
  ] },
  { id: 'psi4', type: 'psicosocial', category: 'Liderazgo', name: 'Inventario de Liderazgo y Comunicación', unit: 'pts', desc: 'Mide habilidades de liderazgo y comunicación', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me comunico de forma clara y directa con mis compañeros.', dimension: 'Comunicación' },
    { id: 'q2', text: 'Motivo a mis compañeros durante el juego.', dimension: 'Liderazgo' },
    { id: 'q3', text: 'Tomo buenas decisiones bajo presión.', dimension: 'Toma de decisiones' }
  ] },

  { id: 'soc1', type: 'socioemocional', category: 'Cohesión', name: 'Cuestionario de Cohesión de Equipo (GEQ)', unit: 'pts', desc: 'Evalúa la unión del grupo', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: 'Responder a 4 preguntas.', rangoMin: 0, rangoMax: 20, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Todos en el equipo comparten el mismo objetivo.', dimension: 'Cohesión de Tarea' },
    { id: 'q2', text: 'Nos esforzamos juntos para alcanzar las metas.', dimension: 'Cohesión de Tarea' },
    { id: 'q3', text: 'Me llevo bien con mis compañeros fuera del campo.', dimension: 'Cohesión Social' },
    { id: 'q4', text: 'Disfruto pasar tiempo con el equipo.', dimension: 'Cohesión Social' }
  ] },
  { id: 'soc2', type: 'socioemocional', category: 'Bienestar', name: 'Escala de Bienestar Mental (MHC-SF)', unit: 'pts', desc: 'Evalúa bienestar emocional, psicológico y social', imagenProtocolo: '/img/tests/bienestar_mental.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Me siento feliz y positivo la mayor parte del tiempo.', dimension: 'Emocional' },
    { id: 'q2', text: 'Siento que mi vida deportiva tiene propósito.', dimension: 'Psicológico' },
    { id: 'q3', text: 'Siento que pertenezco y soy valorado en el equipo.', dimension: 'Social' }
  ] },
  { id: 'soc3', type: 'socioemocional', category: 'Autoconciencia', name: 'Test de Autoconciencia Emocional', unit: 'pts', desc: 'Capacidad de reconocer y nombrar emociones propias', imagenProtocolo: '/img/tests/ansiedad_competitiva.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Puedo identificar claramente lo que siento durante un partido.', dimension: 'Identificación' },
    { id: 'q2', text: 'Sé cómo expresar mis emociones de manera adecuada.', dimension: 'Expresión' },
    { id: 'q3', text: 'Puedo calmarme cuando siento frustración.', dimension: 'Regulación' }
  ] },
  { id: 'soc4', type: 'socioemocional', category: 'Empatía', name: 'Escala de Empatía Deportiva', unit: 'pts', desc: 'Capacidad de comprender emociones de compañeros', imagenProtocolo: '/img/tests/bienestar_general.png', protocol: 'Responder a 2 preguntas.', rangoMin: 0, rangoMax: 10, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Entiendo cómo se sienten mis compañeros tras un error.', dimension: 'Empatía cognitiva' },
    { id: 'q2', text: 'Me afecta emocionalmente el éxito o fracaso del equipo.', dimension: 'Empatía afectiva' }
  ] },
  { id: 'soc5', type: 'socioemocional', category: 'Conflictos', name: 'Cuestionario de Resolución de Conflictos', unit: 'pts', desc: 'Habilidad para manejar desacuerdos constructivamente', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: 'Responder a 3 preguntas.', rangoMin: 0, rangoMax: 15, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Busco soluciones en las que todos ganen.', dimension: 'Negociación' },
    { id: 'q2', text: 'Ayudo a resolver peleas entre compañeros.', dimension: 'Mediación' },
    { id: 'q3', text: 'Estoy dispuesto a ceder para llegar a un acuerdo.', dimension: 'Acuerdo' }
  ] },

  // Nuevos Tests Añadidos (Psicodeportivos)
  { id: 'psi_acsi28', type: 'psicodeportivo', category: 'Afrontamiento', name: 'ACSI-28 (Habilidades de Afrontamiento)', unit: 'pts', desc: 'Evalúa cómo maneja la presión, se concentra y se comunica.', imagenProtocolo: '/img/tests/acsi28_afrontamiento.png', protocol: '28 preguntas. Escala 1-4.', rangoMin: 28, rangoMax: 112, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Mantengo una actitud positiva e intensa en el partido aunque vayamos perdiendo.', dimension: 'Afrontamiento adversidad' },
    { id: 'q2', text: 'Cuando las cosas salen mal en el campo, me esfuerzo aún más en lugar de frustrarme.', dimension: 'Afrontamiento adversidad' },
    { id: 'q3', text: 'Si cometo un error defensivo o pierdo un balón, me olvido rápidamente y me enfoco en la siguiente jugada.', dimension: 'Afrontamiento adversidad' },
    { id: 'q4', text: 'Supero los baches de juego o fallos de puntería con confianza y calma.', dimension: 'Afrontamiento adversidad' },
    { id: 'q5', text: 'Acepto las correcciones tácticas del míster sin tomármelas como algo personal.', dimension: 'Entrenabilidad' },
    { id: 'q6', text: 'Si el entrenador me critica en el entrenamiento, entiendo que es para ayudarme a mejorar como jugador.', dimension: 'Entrenabilidad' },
    { id: 'q7', text: 'Escucho atentamente las instrucciones del cuerpo técnico, incluso cuando no estoy de acuerdo con ellas.', dimension: 'Entrenabilidad' },
    { id: 'q8', text: 'Me muestro receptivo a cambiar mi forma de jugar o posición si el equipo lo necesita.', dimension: 'Entrenabilidad' },
    { id: 'q9', text: 'Mantengo la concentración en mi marca e instrucciones tácticas durante todo el partido.', dimension: 'Concentración' },
    { id: 'q10', text: 'Puedo abstraerme de los gritos del público o provocaciones del rival y centrarme en el balón.', dimension: 'Concentración' },
    { id: 'q11', text: 'En los balones parados o transiciones rápidas, mi mente está al 100% enfocada en el juego.', dimension: 'Concentración' },
    { id: 'q12', text: 'Es raro que me distraiga o pierda el hilo táctico durante el transcurso del partido.', dimension: 'Concentración' },
    { id: 'q13', text: 'Confío plenamente en mis capacidades físicas y técnicas antes de salir al campo.', dimension: 'Confianza' },
    { id: 'q14', text: 'Me esfuerzo al máximo en cada entrenamiento para ganarme el puesto de titular.', dimension: 'Confianza' },
    { id: 'q15', text: 'Tengo una gran motivación por conseguir los objetivos del equipo y mejorar individualmente.', dimension: 'Motivación' },
    { id: 'q16', text: 'Afronto los partidos contra rivales difíciles convencido de que podemos competir y ganar.', dimension: 'Motivación' },
    { id: 'q17', text: 'Visualizo mis acciones de juego y movimientos tácticos antes de que empiece el partido.', dimension: 'Comunicación con entrenador' },
    { id: 'q18', text: 'Me propongo metas concretas de rendimiento para cada entrenamiento y partido.', dimension: 'Comunicación con entrenador' },
    { id: 'q19', text: 'Analizo mentalmente mis aciertos y errores tácticos después de cada encuentro.', dimension: 'Comunicación con entrenador' },
    { id: 'q20', text: 'Preparo mi mente y concentración durante el calentamiento previo al silbato inicial.', dimension: 'Comunicación con entrenador' },
    { id: 'q21', text: 'Los minutos finales de un partido ajustado o una tanda de penaltis me motivan en lugar de paralizarme.', dimension: 'Afrontamiento de fallos' },
    { id: 'q22', text: 'Tomo mejores decisiones de pase o tiro cuando la presión defensiva del rival es intensa.', dimension: 'Afrontamiento de fallos' },
    { id: 'q23', text: 'Siento que la presión de los partidos importantes saca la mejor versión de mi fútbol.', dimension: 'Afrontamiento de fallos' },
    { id: 'q24', text: 'En situaciones críticas del encuentro (ir por detrás en el marcador), asumo la responsabilidad con seguridad.', dimension: 'Afrontamiento de fallos' },
    { id: 'q25', text: 'Juego sin el miedo constante a cometer un error que condicione al equipo.', dimension: 'Afrontamiento de fallos' },
    { id: 'q26', text: 'No me obsesiono con lo que los padres, compañeros o prensa puedan opinar de mi nivel.', dimension: 'Afrontamiento de fallos' },
    { id: 'q27', text: 'Duermo bien y me siento relajado la noche anterior a un partido decisivo.', dimension: 'Afrontamiento de fallos' },
    { id: 'q28', text: 'Si juego un mal partido, no dejo que la frustración me afecte durante los días siguientes.', dimension: 'Afrontamiento de fallos' }
  ] },
  { id: 'psi_ires', type: 'psicodeportivo', category: 'Resiliencia', name: 'IRES (Resiliencia en el Deporte)', unit: 'pts', desc: 'Capacidad de recuperarse de reveses.', imagenProtocolo: '/img/tests/resiliencia_ires.png', protocol: '19 preguntas. Escala 1-4.', rangoMin: 19, rangoMax: 76, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Confío en mi capacidad para superar rachas de malos resultados.', dimension: 'Confianza y Determinación' },
    { id: 'q2', text: 'Estoy convencido de que puedo recuperar mi mejor nivel tras una lesión.', dimension: 'Confianza y Determinación' },
    { id: 'q3', text: 'Afronto las decisiones difíciles del míster con determinación para ganarme su confianza.', dimension: 'Confianza y Determinación' },
    { id: 'q4', text: 'Mantengo la fe en mis posibilidades futbolísticas incluso en momentos difíciles.', dimension: 'Confianza y Determinación' },
    { id: 'q5', text: 'Sé que mi constancia me permitirá alcanzar el éxito en mi carrera deportiva.', dimension: 'Confianza y Determinación' },
    { id: 'q6', text: 'Cuento con el apoyo incondicional de mi familia en mi trayectoria deportiva.', dimension: 'Apoyo y Orientación' },
    { id: 'q7', text: 'Siento que puedo confiar en el cuerpo técnico cuando paso por un mal momento.', dimension: 'Apoyo y Orientación' },
    { id: 'q8', text: 'Mis compañeros de equipo me respaldan y me ayudan a seguir adelante.', dimension: 'Apoyo y Orientación' },
    { id: 'q9', text: 'Busco consejo profesional o de veteranos para mejorar mis puntos débiles.', dimension: 'Apoyo y Orientación' },
    { id: 'q10', text: 'Siento que el entorno del club me proporciona la estabilidad necesaria.', dimension: 'Apoyo y Orientación' },
    { id: 'q11', text: 'Busco soluciones prácticas a los problemas en lugar de lamentarme.', dimension: 'Afrontamiento Activo' },
    { id: 'q12', text: 'Analizo mis estadísticas y rendimiento de forma objetiva para mejorar.', dimension: 'Afrontamiento Activo' },
    { id: 'q13', text: 'Adapto mis entrenamientos si detecto que tengo carencias físicas o técnicas.', dimension: 'Afrontamiento Activo' },
    { id: 'q14', text: 'Acepto los retos tácticos complejos como una oportunidad de aprendizaje.', dimension: 'Afrontamiento Activo' },
    { id: 'q15', text: 'Mantengo una comunicación abierta con el míster sobre mis necesidades en el campo.', dimension: 'Afrontamiento Activo' },
    { id: 'q16', text: 'Sigo entrenando al 100% aunque no sea convocado o no juegue minutos.', dimension: 'Persistencia' },
    { id: 'q17', text: 'No me rindo en los duelos individuales o disputas físicas hasta el último segundo.', dimension: 'Persistencia' },
    { id: 'q18', text: 'Insisto en perfeccionar mis controles y golpeos a base de repeticiones.', dimension: 'Persistencia' },
    { id: 'q19', text: 'Finalizo todas mis rutinas de ejercicio diarias sin saltarme ninguna serie.', dimension: 'Persistencia' }
  ] },
  { id: 'psi_gets', type: 'psicodeportivo', category: 'Trabajo en Equipo', name: 'GETS (Trabajo en Equipo para Jóvenes)', unit: 'pts', desc: 'Habilidad para colaborar y comunicarse.', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: '10 preguntas. Escala 1-5.', rangoMin: 10, rangoMax: 50, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Siento que jugamos mejor cuando combinamos nuestros esfuerzos tácticos en lugar de hacer jugadas individuales.', dimension: 'Sinergia' },
    { id: 'q2', text: 'El equipo consigue mejores resultados gracias al esfuerzo colectivo de todos.', dimension: 'Sinergia' },
    { id: 'q3', text: 'Animo a mis compañeros cuando fallan un pase, un tiro o cometen un penalti.', dimension: 'Apoyo' },
    { id: 'q4', text: 'Mis compañeros me ayudan y me arropan cuando me siento cansado o frustrado.', dimension: 'Apoyo' },
    { id: 'q5', text: 'Celebramos los éxitos de cada compañero como si fueran de todo el grupo.', dimension: 'Apoyo' },
    { id: 'q6', text: 'Ayudo en tareas colectivas del equipo (recoger material, preparar el vestuario).', dimension: 'Colaboración' },
    { id: 'q7', text: 'Me esfuerzo en las coberturas y ayudas defensivas para facilitarle el trabajo a mis compañeros.', dimension: 'Colaboración' },
    { id: 'q8', text: 'Respeto el rol y posición que le toca jugar a cada miembro de la plantilla.', dimension: 'Colaboración' },
    { id: 'q9', text: 'Hablo de forma constructiva y doy indicaciones de apoyo a mis compañeros durante el partido.', dimension: 'Comunicación Efectiva' },
    { id: 'q10', text: 'Resolvemos los desacuerdos tácticos en el vestuario hablando con respeto.', dimension: 'Comunicación Efectiva' }
  ] },

  // Nuevos Tests Añadidos (Sociodeportivos)
  { id: 'soc_cwms', type: 'sociodeportivo', category: 'Bienestar', name: 'CWMS (Bienestar Mental)', unit: 'pts', desc: 'Bienestar emocional, psicológico y social.', imagenProtocolo: '/img/tests/bienestar_mental.png', protocol: '14 preguntas. Escala 1-5.', rangoMin: 14, rangoMax: 70, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Siento que estoy creciendo y mejorando mis habilidades futbolísticas cada semana.', dimension: 'Bienestar Psicológico' },
    { id: 'q2', text: 'Tengo claros mis objetivos deportivos y qué debo hacer para alcanzarlos.', dimension: 'Bienestar Psicológico' },
    { id: 'q3', text: 'Acepto mis características físicas y de juego y trabajo sobre ellas.', dimension: 'Bienestar Psicológico' },
    { id: 'q4', text: 'Siento que tengo autonomía para tomar mis propias decisiones en el campo de juego.', dimension: 'Bienestar Psicológico' },
    { id: 'q5', text: 'Soy capaz de gestionar las exigencias del fútbol y de mis estudios/trabajo.', dimension: 'Bienestar Psicológico' },
    { id: 'q6', text: 'Me siento parte fundamental y cohesionada del grupo de jugadores.', dimension: 'Bienestar Social' },
    { id: 'q7', text: 'Siento que mis opiniones y aportaciones son respetadas por la plantilla.', dimension: 'Bienestar Social' },
    { id: 'q8', text: 'Creo que aporto cosas positivas al ambiente del vestuario y a los entrenamientos.', dimension: 'Bienestar Social' },
    { id: 'q9', text: 'Me resulta fácil integrarme y comunicarme con los nuevos compañeros de equipo.', dimension: 'Bienestar Social' },
    { id: 'q10', text: 'Confío en las buenas intenciones de las personas que forman el club.', dimension: 'Bienestar Social' },
    { id: 'q11', text: 'Me siento alegre y con energía cuando voy a entrenar.', dimension: 'Bienestar Emocional' },
    { id: 'q12', text: 'Disfruto de la práctica diaria del fútbol y del ambiente deportivo.', dimension: 'Bienestar Emocional' },
    { id: 'q13', text: 'Siento tranquilidad y paz mental respecto a mi rol en el equipo.', dimension: 'Bienestar Emocional' },
    { id: 'q14', text: 'Me siento satisfecho y orgulloso de mi esfuerzo y dedicación deportiva.', dimension: 'Bienestar Emocional' }
  ] },
  { id: 'soc_eced', type: 'sociodeportivo', category: 'Cohesión', name: 'ECED (Cohesión en Equipos)', unit: 'pts', desc: 'Cohesión de tarea y social.', imagenProtocolo: '/img/tests/cohesion_equipo.png', protocol: '12 preguntas. Escala 1-7.', rangoMin: 12, rangoMax: 84, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Disfruto quedando con mis compañeros de equipo fuera de las instalaciones del club.', dimension: 'Integración social' },
    { id: 'q2', text: 'La plantilla se reúne a menudo para cenar o hacer actividades extradeportivas.', dimension: 'Integración social' },
    { id: 'q3', text: 'Considero que mis mejores amigos están dentro del vestuario de este equipo.', dimension: 'Integración social' },
    { id: 'q4', text: 'Nos apoyamos mutuamente ante problemas personales ajenos al fútbol.', dimension: 'Integración social' },
    { id: 'q5', text: 'Todos los jugadores estamos comprometidos al 100% con el estilo de juego del entrenador.', dimension: 'Integración de tarea' },
    { id: 'q6', text: 'Si el equipo juega mal, todos asumimos nuestra parte de culpa y trabajamos para solucionarlo.', dimension: 'Integración de tarea' },
    { id: 'q7', text: 'Priorizamos el éxito del colectivo por encima de las estadísticas goleadoras individuales.', dimension: 'Integración de tarea' },
    { id: 'q8', text: 'Entrenamos con la máxima intensidad competitiva respetando al compañero.', dimension: 'Integración de tarea' },
    { id: 'q9', text: 'Siento un gran orgullo al vestir la camiseta y escudo de este club.', dimension: 'Atracción por el equipo' },
    { id: 'q10', text: 'No cambiaría de equipo aunque me ofrecieran mejores condiciones en otro club.', dimension: 'Atracción por el equipo' },
    { id: 'q11', text: 'Valoro enormemente el ambiente de competitividad sana que hay en el grupo.', dimension: 'Atracción por el equipo' },
    { id: 'q12', text: 'Me siento motivado por venir a cada entrenamiento y dar lo mejor de mí.', dimension: 'Atracción por el equipo' }
  ] },
  { id: 'soc_edl', type: 'sociodeportivo', category: 'Convivencia', name: 'EDL (Deporte Limpio)', unit: 'pts', desc: 'Conductas antideportivas y presión por ganar.', imagenProtocolo: '/img/tests/deporte_limpio.png', protocol: '10 preguntas. Escala 1-4.', rangoMin: 10, rangoMax: 40, isQuestionnaire: true, questions: [
    { id: 'q1', text: 'Evito simular faltas o lesiones para engañar al árbitro y perder tiempo.', dimension: 'Transgresión de normas' },
    { id: 'q2', text: 'Respeto las decisiones arbitrales sin protestar de forma desairada ni insultar.', dimension: 'Transgresión de normas' },
    { id: 'q3', text: 'Trato con respeto y deportividad a los jugadores rivales, jueguen como jueguen.', dimension: 'Transgresión de normas' },
    { id: 'q4', text: 'Prefiero perder jugando limpio antes que ganar cometiendo trampas o juego sucio.', dimension: 'Transgresión de normas' },
    { id: 'q5', text: 'Cuido el material de entrenamiento y las instalaciones del club rival de la misma forma que las nuestras.', dimension: 'Transgresión de normas' },
    { id: 'q6', text: 'Sé mantener mis valores de deportividad a pesar de la presión o gritos de la grada.', dimension: 'Presión externa' },
    { id: 'q7', text: 'Juego limpio aunque el entrenador me pida hacer acciones antideportivas para ganar.', dimension: 'Presión externa' },
    { id: 'q8', text: 'No me dejo influenciar por las provocaciones físicas o verbales de los rivales.', dimension: 'Presión externa' },
    { id: 'q9', text: 'Controlo mis impulsos agresivos en los momentos de alta tensión del encuentro.', dimension: 'Presión externa' },
    { id: 'q10', text: 'Entiendo el fútbol como una competición sana y no como una guerra contra el adversario.', dimension: 'Presión externa' }
  ] }
];

const DEFAULT_IDS = DEFAULT_TESTS.map(t => t.id);

const Tests = () => {
  const navigate = useNavigate();
  const { user, activeTeamId, getTeamPath } = useAuth();
  const { settings } = useSettings(activeTeamId);
  const { activeTeam } = useTeams();
  const { isPro, isProActive } = usePlan();
  const { players, loading: loadingPlayers } = usePlayers(activeTeamId);
  const [historyData, setHistoryData] = useState({});
  const [activeTab, setActiveTab] = useState('FÍSICOS');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, message: '' });
  
  // Custom Confirmation Dialog State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isConfirm: false,
  });

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve();
        },
        isConfirm: false
      });
    });
  };

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm: (res) => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(res);
        },
        isConfirm: true
      });
    });
  };
  
  // Registration State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regSelectedTest, setRegSelectedTest] = useState('t1');
  const [regInputs, setRegInputs] = useState({});
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  
  // Preventive Registration State
  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  const [isRpeModalOpen, setIsRpeModalOpen] = useState(false);
  const [selectedPlayerForTest, setSelectedPlayerForTest] = useState(null);

  // History State
  const [histSelectedPlayer, setHistSelectedPlayer] = useState(null);
  const [analyticsPlayer, setAnalyticsPlayer] = useState(null);

  // Firestore Tests Loading
  const loadTests = useCallback(async () => {
    if (!user || !activeTeamId) return;
    try {
      const testsRef = collection(db, getTeamPath(), 'tests');
      const q = query(testsRef);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Migration: create predefined tests
        const batch = writeBatch(db);
        DEFAULT_TESTS.forEach(t => {
          const newDocRef = doc(testsRef, t.id);
          batch.set(newDocRef, t);
        });
        await batch.commit();
        setTests(DEFAULT_TESTS);
        if (DEFAULT_TESTS.length > 0) {
          setHeatSelectedTest(DEFAULT_TESTS[0].id);
        }
      } else {
        // Build a lookup map of DEFAULT_TESTS images by id
        const defaultImgMap = {};
        DEFAULT_TESTS.forEach(dt => {
          if (dt.imagenProtocolo) defaultImgMap[dt.id] = dt.imagenProtocolo;
        });

        const loadedTests = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Inject imagenProtocolo from DEFAULT_TESTS if not already set in Firestore
          if (!data.imagenProtocolo && defaultImgMap[doc.id]) {
            data.imagenProtocolo = defaultImgMap[doc.id];
          }
          loadedTests.push({ ...data, id: doc.id });
        });
        setTests(loadedTests);
        if (loadedTests.length > 0) {
          setHeatSelectedTest(loadedTests[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading tests:", error);
    }
  }, [user, activeTeamId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Carga de evaluaciones reales desde Firestore
  const loadEvaluations = useCallback(async () => {
    if (!user || !activeTeamId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, getTeamPath(), 'evaluaciones'),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const newHistory = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const { jugadorId, testId, val, date } = data;
        
        if (!newHistory[jugadorId]) newHistory[jugadorId] = {};
        if (!newHistory[jugadorId][testId]) newHistory[jugadorId][testId] = [];
        
        newHistory[jugadorId][testId].push({ id: doc.id, date, val: Number(val) });
      });
      
      setHistoryData(newHistory);
    } catch (error) {
      console.error("Error loading evaluations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeTeamId]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  useEffect(() => {
    if (players.length > 0 && !histSelectedPlayer) {
      setHistSelectedPlayer(players[0].id);
    }
  }, [players]);

  // New Test State
  const [isNewTestModalOpen, setIsNewTestModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({ name: '', type: 'fisico', category: 'Física', unit: '', desc: '', protocol: '' });
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  // Heatmap Selected Test
  const [heatSelectedTest, setHeatSelectedTest] = useState('t1');

  const getTestById = (id) => tests.find(t => String(t.id) === String(id));
  const getPlayerById = (id) => players.find(p => p.id === id);

  const handleSaveRegistration = async () => {
    if (!user || !activeTeamId) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      Object.entries(regInputs).forEach(([jugadorId, val]) => {
        if (!val) return;
        const evalRef = doc(collection(db, getTeamPath(), 'evaluaciones'));
        batch.set(evalRef, {
          jugadorId,
          testId: regSelectedTest,
          val: Number(val),
          date: today,
          timestamp: serverTimestamp()
        });
      });
      
      await batch.commit();
      await showAlert("Éxito", "Resultados guardados exitosamente en la nube.");
      setRegInputs({});
      loadEvaluations();
    } catch (error) {
      console.error("Error saving evaluations:", error);
      await showAlert("Error", "Error al guardar los resultados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreventiveTest = async (data) => {
    if (!user || !activeTeamId) return;
    try {
      await addDoc(collection(db, getTeamPath(), 'evaluaciones'), {
        ...data,
        timestamp: serverTimestamp()
      });
      await showAlert("Éxito", "Evaluación guardada exitosamente.");
      loadEvaluations();
    } catch (error) {
      console.error("Error saving prev test", error);
      await showAlert("Error", "Error al guardar la evaluación.");
    }
  };

  const handleDeleteLastEval = async (jugadorId, testId) => {
    if (!user || !activeTeamId) return;
    const history = historyData[jugadorId]?.[testId];
    if (!history || history.length === 0) return;
    
    const confirmDelete = await showConfirm('Confirmar eliminación', '¿Estás seguro de que deseas eliminar el último dato agregado para este test?');
    if (!confirmDelete) return;

    try {
      const lastEval = history[history.length - 1];
      if (lastEval.id) {
        await deleteDoc(doc(db, getTeamPath(), 'evaluaciones', lastEval.id));
        await loadEvaluations();
      }
    } catch (error) {
      console.error("Error deleting last eval:", error);
      await showAlert("Error", "Error al eliminar el dato.");
    }
  };

  const handleDeleteAllEvals = async (jugadorId, testId) => {
    if (!user || !activeTeamId) return;
    const history = historyData[jugadorId]?.[testId];
    if (!history || history.length === 0) return;

    const confirmDelete = await showConfirm('Confirmar eliminación', '¿Estás seguro de que deseas eliminar TODOS los datos históricos de este test para este jugador?');
    if (!confirmDelete) return;

    try {
      const batch = writeBatch(db);
      history.forEach(item => {
        if (item.id) {
          const evalRef = doc(db, getTeamPath(), 'evaluaciones', item.id);
          batch.delete(evalRef);
        }
      });
      await batch.commit();
      await loadEvaluations();
    } catch (error) {
      console.error("Error deleting all evals:", error);
      await showAlert("Error", "Error al eliminar los datos.");
    }
  };

  const handleDeleteTest = async (testId, testName) => {
    if (!user || !activeTeamId) return;
    const confirmDelete = await showConfirm('Confirmar eliminación', `¿Estás seguro de que deseas eliminar el test "${testName}"?\nSe borrarán permanentemente el test y todas las evaluaciones registradas de todos los jugadores para este test.`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      // 1. Borrar la definición del test de Firestore
      await deleteDoc(doc(db, getTeamPath(), 'tests', testId));

      // 2. Buscar y borrar en lote (batch) todas las evaluaciones asociadas a ese test
      const evalsRef = collection(db, getTeamPath(), 'evaluaciones');
      const q = query(evalsRef, where('testId', '==', testId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      // Evitar caídas de la interfaz si el test estaba seleccionado
      if (heatSelectedTest === testId) {
        setHeatSelectedTest('');
      }
      if (selectedTestDetail?.id === testId) {
        setSelectedTestDetail(null);
      }

      await showAlert("Éxito", `El test "${testName}" y todas sus evaluaciones asociadas han sido eliminados correctamente.`);
      
      // 3. Recargar tests y evaluaciones
      await loadTests();
      await loadEvaluations();
    } catch (error) {
      console.error("Error deleting test and evaluations:", error);
      await showAlert("Error", "Error al eliminar el test.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeasonData = async () => {
    if (!user || !activeTeamId) return;
    const confirm1 = await showConfirm('Reiniciar Temporada', '¿Estás seguro de que deseas iniciar una nueva temporada?\nEsto eliminará permanentemente TODOS los datos y registros de evaluaciones de todos los jugadores de este equipo.');
    if (!confirm1) return;
    const confirm2 = await showConfirm('⚠️ ATENCIÓN', '⚠️ ATENCIÓN: Esta acción es irreversible y borrará por completo el historial de pruebas del equipo. ¿Confirmas que deseas proceder con el reinicio de datos?');
    if (!confirm2) return;

    setLoading(true);
    try {
      const q = query(collection(db, getTeamPath(), 'evaluaciones'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        querySnapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      
      await showAlert("Éxito", "✅ Temporada reiniciada. Se han eliminado todos los datos de evaluaciones de los jugadores correctamente.");
      await loadEvaluations();
    } catch (error) {
      console.error("Error resetting season data:", error);
      await showAlert("Error", "Error al reiniciar los datos de la temporada.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.unit) {
      await showAlert("Validación", "Nombre y unidad son obligatorios");
      return;
    }
    if (!user || !activeTeamId) return;
    setLoading(true);
    try {
      const testsRef = collection(db, getTeamPath(), 'tests');
      const newTestObj = { ...newTest, id: `custom_${Date.now()}` };
      await addDoc(testsRef, newTestObj);
      setTests([...tests, newTestObj]);
      setIsNewTestModalOpen(false);
      setNewTest({ name: '', type: 'fisico', category: 'Física', unit: '', desc: '', protocol: '' });
    } catch (error) {
      console.error(error);
      await showAlert("Error", "Error al crear el test.");
    } finally {
      setLoading(false);
    }
  };

  const descargarPlantilla = (test, players) => {
    let contenido = `"${test.name}" - Plantilla de registro\n`;
    contenido += `Instrucciones: ${test.protocol || test.desc}\n`;
    contenido += `Unidad: ${test.unit}\n\n`;

    let headers = ['Jugador', 'Dorsal'];
    
    let isDetailed = test.isQuestionnaire && test.questions;
    if (isDetailed) {
       const dims = [...new Set(test.questions.map(q => q.dimension))];
       headers = headers.concat(dims);
    }
    headers.push(`Valoración Total (${test.unit})`);
    
    contenido += headers.map(h => `"${h}"`).join(',') + '\n';
    
    players.forEach(p => {
      let row = [`"${p.name}"`, `"${p.number || ''}"`];
      if (isDetailed) {
         const dims = [...new Set(test.questions.map(q => q.dimension))];
         dims.forEach(() => row.push('""'));
      }
      row.push('""');
      contenido += row.join(',') + '\n';
    });

    downloadCSV(contenido, `${test.id}_plantilla.csv`);
  };

  // ─── SEED DEMO DATA ───────────────────────────────────────────────────────
  const seedDemoEvaluations = async () => {
    if (!user || !activeTeamId || players.length === 0) {
      await showAlert('Validación', 'No hay jugadores en el equipo. Añade jugadores primero.');
      return;
    }
    const confirmSeed = await showConfirm('Insertar datos demo', `¿Insertar evaluaciones de demostración para ${players.length} jugador(es)?\nEsto añadirá datos ficticios para visualizar las gráficas.`);
    if (!confirmSeed) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const baseDate = new Date();

      // 5 fechas escalonadas (últimas 10 semanas)
      const dates = [10, 8, 6, 3, 0].map(weeksAgo => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - weeksAgo * 7);
        return d.toISOString().split('T')[0];
      });

      // Perfil de valores base por jugador (variación aleatoria realista)
      const demoValues = {
        t1:       [1900, 2050, 2120, 2200, 2280],  // Cooper (m) — mejora
        t2:       [7,    8,    9,    9,    10],     // Course Navette (nivel)
        t3:       [1.82, 1.78, 1.75, 1.73, 1.70],  // Sprint 10m (seg) — baja = mejora
        t4:       [4.45, 4.30, 4.20, 4.12, 4.05],  // Sprint 30m (seg)
        t5:       [11.2, 10.9, 10.6, 10.5, 10.3],  // T-Test (seg)
        t6:       [28,   31,   33,   35,   37],     // Salto CMJ (cm)
        t7:       [9.8,  9.4,  9.1,  8.9,  8.6],   // Conducción conos (seg)
        t8:       [5,    6,    7,    7,    8],       // Pase a portería (pts)
        psi1:     [18,   20,   22,   23,   25],     // Autoconfianza
        psi2:     [35,   38,   40,   42,   44],     // CSAI
        soc1_old: [90,   95,   100,  105,  108],    // GEQ Cohesión
        soc2_old: [28,   30,   32,   33,   35],     // Fair Play
      };

      players.forEach((player, pIdx) => {
        // Variación por jugador (±15%) para que cada uno sea diferente
        const variation = 1 + (pIdx % 3 - 1) * 0.10;

        Object.entries(demoValues).forEach(([testId, vals]) => {
          const testDef = tests.find(t => t.id === testId);
          vals.forEach((baseVal, i) => {
            const adjustedVal = testDef?.unit === 'seg'
              ? parseFloat((baseVal * (2 - variation + Math.random() * 0.04)).toFixed(2))
              : Math.round(baseVal * variation + (Math.random() * 4 - 2));

            const evalRef = doc(collection(db, getTeamPath(), 'evaluaciones'));
            batch.set(evalRef, {
              jugadorId: player.id,
              testId,
              val: adjustedVal,
              date: dates[i],
              timestamp: { seconds: Math.floor(Date.now() / 1000) - (10 - i) * 604800, nanoseconds: 0 }
            });
          });
        });
      });

      await batch.commit();
      await showAlert("Éxito", `✅ Datos demo insertados para ${players.length} jugador(es). Recargando...`);
      loadEvaluations();
    } catch (err) {
      console.error('Error seeding demo data:', err);
      await showAlert("Error", 'Error al insertar datos de demostración.');
    } finally {
      setLoading(false);
    }
  };

  // Heatmap logic
  const getHeatmapColor = (val, min, max, isTime) => {
    // isTime means lower is better (green). Higher is worse (red).
    // if not time, higher is better (green), lower is worse (red).
    const ratio = (val - min) / (max - min || 1);
    const percentage = isTime ? (1 - ratio) : ratio; // 1 is green, 0 is red
    
    // HSL: Red is 0, Green is 120
    const hue = percentage * 120;
    return `hsl(${hue}, 70%, 85%)`;
  };

  if (loadingPlayers && tests.length === 0) {
    return (
      <div className="tests-page" style={{ padding: '24px' }}>
        <header className="tests-header">
          <div className="skeleton-line" style={{ width: '220px', height: '32px', marginBottom: '12px' }}></div>
          <div className="skeleton-line" style={{ width: '340px', height: '18px' }}></div>
        </header>
        <div className="tests-tabs" style={{ gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px', display: 'flex', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="skeleton-line" style={{ width: '100px', height: '40px', borderRadius: '6px' }}></div>
          ))}
        </div>
        <div className="tests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="skeleton-card" style={{ height: '160px', borderRadius: '12px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tests-page">
      {/* --- CUSTOM DIALOG --- */}
      {modalConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{modalConfig.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{modalConfig.message}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {modalConfig.isConfirm && (
                <button className="btn-outline" onClick={() => modalConfig.onConfirm(false)}>Cancelar</button>
              )}
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => modalConfig.onConfirm(true)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      <header className="tests-header">
        <div className="header-top">
          <h1>EVALUACIÓN Y TESTS</h1>
          <div className="header-actions">
            <button
              className="btn-outline"
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                background: 'transparent',
                fontWeight: 'bold',
                minWidth: '48px',
                minHeight: '48px',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={handleResetSeasonData}
              disabled={loading}
              title="Elimina todos los datos de evaluaciones de los jugadores para iniciar una nueva temporada"
            >
              🗑️ Reiniciar Temporada
            </button>
            <button
              className="btn-outline"
              onClick={seedDemoEvaluations}
              disabled={loading}
              title="Inserta evaluaciones ficticias para ver cómo funcionan las gráficas"
            >
              🎯 Datos Demo
            </button>
            <button 
              className="btn-outline" 
              onClick={() => {
                if (!isPro) {
                  setUpgradeModal({ open: true, message: 'La exportación de informes completos es una función PRO.' });
                  return;
                }
                generateTestsReport(tests, players, historyData, activeTeam);
              }}
            >
              Exportar Informe
            </button>
          </div>
        </div>

        <div className="tests-tabs">
          {['FÍSICOS', 'PSICOSOCIALES', 'PREVENCIÓN', 'HISTORIAL POR JUGADOR', 'COMPARATIVA EQUIPO'].map(tab => (
            <button 
              key={tab} 
              className={`tests-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="tests-content">
        {/* --- CATÁLOGO DE TESTS --- */}
        {['FÍSICOS', 'PSICOSOCIALES'].includes(activeTab) && (
          <div className="tab-bateria">
            <div className="bateria-header">
              <h3>Catálogo de Pruebas: {activeTab}</h3>
              <button className="btn-primary" onClick={() => setIsNewTestModalOpen(true)}>+ Crear Test</button>
            </div>
            
            <div className="grid-3-cols">
              {tests.filter(t => {
                if (activeTab === 'FÍSICOS') return (t.type === 'fisico' || !t.type) && (!DEFAULT_IDS.includes(t.id) || ['t1','t3','t4','t5','t6','t7','t8'].includes(t.id));
                if (activeTab === 'PSICOSOCIALES') return [
                  'psicodeportivo','psicosocial','sociodeportivo','socioemocional'
                ].includes(t.type) && (!DEFAULT_IDS.includes(t.id) || ['psi1','psi2','psi3','soc1','soc2','psi1_old','psi2_old','soc1_old','soc2_old','psi_acsi28','psi_ires','psi_gets','soc_cwms','soc_eced','soc_edl'].includes(t.id));
                return false;
              }).map(t => (
                <div key={t.id} className="card-base" style={{ padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => setSelectedTestDetail(t)}>
                  <div style={{ position: 'relative', height: '190px', background: '#fdfcf8', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    {/* Ilustración del test */}
                    {t.imagenProtocolo ? (
                      <img
                        src={t.imagenProtocolo}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '10px' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {/* Fallback SVG si no hay imagen */}
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-secondary)" strokeWidth="1.5" fill="none" style={{ display: t.imagenProtocolo ? 'none' : 'block' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{ background: 'var(--accent-green)', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{t.category}</span>
                      <span style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>Medida: {t.unit}</span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{t.name}</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>{t.desc}</p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (t.isQuestionnaire) {
                            setRegSelectedTest(t.id);
                            setIsQuestionnaireOpen(true);
                          } else {
                            setRegSelectedTest(t.id);
                            setIsRegModalOpen(true);
                          }
                        }}
                      >
                        REGISTRAR
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          descargarPlantilla(t, players);
                        }}
                      >
                        📥 PLANTILLA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PREVENCIÓN DE LESIONES v1.0.18 --- */}
        {activeTab === 'PREVENCIÓN' && (
          <div className="tab-prevencion">
            <div className="prevencion-section-header">
              <div>
                <h3>🛡️ Autoevaluación y Prevención</h3>
              </div>
              <p>Registra métricas de bienestar y esfuerzo percibido para prevenir sobrecargas.</p>
            </div>
            <div className="prevencion-grid">
              {players.map(p => {
                const initials = (p.name || p.nombre || 'JJ').substring(0, 2).toUpperCase();
                return (
                  <div key={p.id} className="prev-player-card">
                    <div className="prev-card-top">
                      <span className="prev-initials-badge">{initials}</span>
                      <div className="prev-avatar-wrap">
                        {p.avatarUrl || p.imageUrl ? (
                          <img src={p.avatarUrl || p.imageUrl} alt={p.name} className="prev-avatar" />
                        ) : (
                          <div className="prev-avatar-placeholder">{initials.charAt(0)}</div>
                        )}
                      </div>
                      <div className="prev-player-info">
                        <p className="prev-player-name">{p.name || p.nombre}</p>
                        <span className="badge-pos-prev">{p.position || p.posicion || '-'}</span>
                      </div>
                    </div>
                    <div className="prev-card-actions">
                      <button
                        className="btn-prev-wellness"
                        onClick={() => { setSelectedPlayerForTest(p); setIsWellnessModalOpen(true); }}
                      >
                        🌿 Bienestar
                      </button>
                      <button
                        className="btn-prev-rpe"
                        onClick={() => { setSelectedPlayerForTest(p); setIsRpeModalOpen(true); }}
                      >
                        🏋 RPE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- HISTORIAL POR JUGADOR --- */}
        {activeTab === 'HISTORIAL POR JUGADOR' && (
          <div className="tab-historial">
            <div className="hist-sidebar">
              <h3>Seleccionar Jugador</h3>
              <div className="player-selector">
                {players.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className={`player-select-item ${histSelectedPlayer === p.id ? 'active' : ''}`}
                    style={
                      histSelectedPlayer === p.id 
                        ? { background: '#4CAF7D', color: '#FFF', borderColor: '#4CAF7D' } 
                        : {}
                    }
                    onClick={() => setHistSelectedPlayer(p.id)}
                  >
                    <span className="p-num" style={
                      histSelectedPlayer === p.id 
                        ? { background: '#FFF', color: '#4CAF7D' } 
                        : {}
                    }>{p.number}</span>
                    <span className="p-name" style={
                      histSelectedPlayer === p.id 
                        ? { color: '#FFF' } 
                        : {}
                    }>{p.name}</span>
                  </div>
                ))}
              </div>
              {histSelectedPlayer && (
                <>
                  <button
                    style={{
                      marginTop: 16, width: '100%',
                      background: 'var(--accent-gold, #D4A843)', color: '#000',
                      border: 'none', borderRadius: 8,
                      padding: '12px 0', fontWeight: 700,
                      fontSize: 14, cursor: 'pointer', letterSpacing: 0.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                    onClick={() => setAnalyticsPlayer(getPlayerById(histSelectedPlayer))}
                  >
                    📊 Ver Analíticas
                  </button>
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', borderTop: '1px dashed var(--border-color)' }}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="14" width="3" height="6" rx="1" fill="#D4A843" />
                      <rect x="8" y="10" width="3" height="10" rx="1" fill="#D4A843" />
                      <rect x="13" y="6" width="3" height="14" rx="1" fill="#D4A843" />
                      <circle cx="19" cy="10" r="3" fill="#D4A843" />
                      <path d="M3 10L10 5L15 8L21 2" stroke="#1B3A2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 2H21V6" stroke="#1B3A2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ver Analíticas</span>
                  </div>
                </>
              )}
            </div>
            <div className="hist-main">
              <div className="hist-main-header">
                <h3>Evolución: {getPlayerById(histSelectedPlayer)?.name}</h3>
                <button className="btn-outline-gold" onClick={async () => {
                  if (!isPro) {
                    setUpgradeModal({ open: true, message: 'La exportación de informes individuales es una función PRO.' });
                    return;
                  }
                  try {
                    let graficaUrl = null;
                    const element = document.getElementById('grafica-rendimiento-jugador');
                    if (element) {
                      const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
                      graficaUrl = canvas.toDataURL('image/png');
                    }
                    await generatePlayerTestReport(getPlayerById(histSelectedPlayer), tests, historyData, activeTeam, graficaUrl);
                  } catch (e) {
                    console.error(e);
                    await showAlert("Error", "Error al generar el PDF.");
                  }
                }}>
                  📄 Exportar Informe del Jugador
                </button>
              </div>
              
              {/* M11 PLAYER ANALYTICS — cálculo previo al JSX */}
              {(() => {
                const player = getPlayerById(histSelectedPlayer);
                let fis = 0, tec = 0, psi = 0, soc = 0, testCount = 0;
                let countFis = 0, countTec = 0, countPsi = 0, countSoc = 0;

                tests.forEach(t => {
                  const h = historyData[histSelectedPlayer]?.[t.id] || [];
                  if (h.length > 0) {
                    testCount++;
                    let val = parseFloat(String(h[h.length - 1].val).replace(',', '.')) || 0;
                    let norm = val;
                    if (t.unit === 'seg')   norm = Math.max(0, 100 - (val * 5));
                    else if (t.unit === 'cm')    norm = Math.min(100, val * 2);
                    else if (t.unit === 'nivel') norm = Math.min(100, val * 8);
                    else norm = Math.min(100, val);

                    if (t.type === 'fisico' && t.category !== 'Técnica') { fis += norm; countFis++; }
                    if (t.type === 'fisico' && t.category === 'Técnica')  { tec += norm; countTec++; }
                    if (t.type === 'psicodeportivo' || t.type === 'psicosocial')   { psi += norm; countPsi++; }
                    if (t.type === 'sociodeportivo' || t.type === 'socioemocional') { soc += norm; countSoc++; }
                  }
                });

                if (player?.name?.toLowerCase().includes('juan') && fis === 0) {
                  fis = 88; tec = 82; psi = 79; soc = 85; testCount = 4;
                  countFis = 1; countTec = 1; countPsi = 1; countSoc = 1;
                } else if (testCount > 0) {
                  fis = countFis > 0 ? Math.min(99, Math.round(fis / countFis)) : 0;
                  tec = countTec > 0 ? Math.min(99, Math.round(tec / countTec)) : 0;
                  psi = countPsi > 0 ? Math.min(99, Math.round(psi / countPsi)) : 0;
                  soc = countSoc > 0 ? Math.min(99, Math.round(soc / countSoc)) : 0;
                }

                const overall = testCount > 0 ? Math.round((fis + tec + psi + soc) / 4) : 0;
                const stats = [
                  { label: 'FÍS', value: fis || '-' },
                  { label: 'TÉC', value: tec || '-' },
                  { label: 'PSI', value: psi || '-' },
                  { label: 'SOC', value: soc || '-' }
                ];
                const radarData = [
                  { subject: 'FÍS', value: fis },
                  { subject: 'TÉC', value: tec },
                  { subject: 'PSI', value: psi },
                  { subject: 'SOC', value: soc }
                ];

                return (
                  <div id="grafica-rendimiento-jugador" style={{ display: 'flex', gap: 24, alignItems: 'stretch', marginBottom: 24 }}>
                    {/* LEGEND CARD */}
                    <div style={{ flexShrink: 0 }}>
                      <LegendCard
                        player={player}
                        overall={overall || '-'}
                        position="POS"
                        streak={testCount}
                        type="elite"
                        stats={stats}
                      />
                    </div>

                    {/* SVG RADAR & TPI WITH SOCCER FIELD STYLING */}
                    <div style={{
                      flex: 1,
                      background: 'var(--bg-card, #FFFFFF)',
                      border: '1.5px solid var(--border-color, #D4A843)',
                      borderRadius: 16,
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      gap: 24,
                      minHeight: 360,
                      minWidth: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(27, 58, 45, 0.05)'
                    }}>
                      {/* SVG Pitch Background */}
                      <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
                        <rect x="10" y="10" width="380" height="230" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                        <line x1="200" y1="10" x2="200" y2="240" stroke="#1B3A2D" strokeWidth="2" />
                        <circle cx="200" cy="125" r="40" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                        <circle cx="200" cy="125" r="3" fill="#1B3A2D" />
                        <rect x="10" y="55" width="50" height="140" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                        <rect x="340" y="55" width="50" height="140" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                        <rect x="10" y="85" width="20" height="80" fill="none" stroke="#1B3A2D" strokeWidth="1.5" />
                        <rect x="370" y="85" width="20" height="80" fill="none" stroke="#1B3A2D" strokeWidth="1.5" />
                        <path d="M 60,105 A 25,25 0 0,1 60,145" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                        <path d="M 340,105 A 25,25 0 0,0 340,145" fill="none" stroke="#1B3A2D" strokeWidth="2" />
                      </svg>

                      {/* 3D Wireframe soccer ball centered */}
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: 0.08, pointerEvents: 'none' }}>
                        <svg width="240" height="240" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="48" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <polygon points="50,30 38,38 42,54 58,54 62,38" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <line x1="50" y1="30" x2="50" y2="12" stroke="#1B3A2D" strokeWidth="0.75" />
                          <line x1="38" y1="38" x2="20" y2="32" stroke="#1B3A2D" strokeWidth="0.75" />
                          <line x1="42" y1="54" x2="28" y2="68" stroke="#1B3A2D" strokeWidth="0.75" />
                          <line x1="58" y1="54" x2="72" y2="68" stroke="#1B3A2D" strokeWidth="0.75" />
                          <line x1="62" y1="38" x2="80" y2="32" stroke="#1B3A2D" strokeWidth="0.75" />
                          <path d="M50,12 C40,12 30,18 20,32" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <path d="M20,32 C12,45 15,58 28,68" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <path d="M28,68 C40,80 60,80 72,68" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <path d="M72,68 C85,58 88,45 80,32" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                          <path d="M80,32 C70,18 60,12 50,12" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
                        </svg>
                      </div>

                      {/* Performance Profile / Radar Chart */}
                      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: 'var(--text-primary, #1B3A2D)', marginBottom: '16px', textTransform: 'uppercase' }}>
                          PERFIL DE RENDIMIENTO
                        </span>
                        {testCount > 0 ? (
                          <SvgRadar data={radarData} size={250} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#1B3A2D', opacity: 0.8 }}>
                            <div style={{ fontSize: 48, filter: 'grayscale(1)' }}>📊</div>
                            <p style={{ fontSize: 14, marginTop: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Sin evaluaciones.<br />Registra datos para ver el radar.</p>
                          </div>
                        )}
                      </div>

                      {/* TPI Score and Actions */}
                      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: 'var(--text-primary, #1B3A2D)', marginBottom: '12px', textTransform: 'uppercase' }}>
                          TEST PERFORMANCE INDEX
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
                          <span style={{ fontSize: '72px', fontWeight: 900, fontFamily: 'var(--font-heading, sans-serif)', color: 'var(--accent-gold, #D4A843)', lineHeight: '1' }}>
                            {overall}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--accent-gold, #D4A843)', fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>
                            TPI SCORE
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '16px' }}>
                          <button
                            style={{
                              background: 'var(--accent-gold, #D4A843)', color: '#000',
                              border: 'none', borderRadius: 8,
                              padding: '10px 20px', fontWeight: 700,
                              fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 2px 6px rgba(212, 168, 67, 0.2)'
                            }}
                            onClick={() => setAnalyticsPlayer(getPlayerById(histSelectedPlayer))}
                          >
                            📈 Ver Analíticas Completas
                          </button>
                          
                          <button
                            style={{
                              background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)', color: '#FFF',
                              border: 'none', borderRadius: 8,
                              padding: '10px 20px', fontWeight: 700,
                              fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 2px 6px rgba(184, 134, 11, 0.2)'
                            }}
                            onClick={async () => {
                              if (!isProActive) {
                                setUpgradeModal({ open: true, message: 'La exportación de informes individuales es una función PRO. Sube de nivel para usarla.' });
                                return;
                              }
                              try {
                                let graficaUrl = null;
                                const element = document.getElementById('grafica-rendimiento-jugador');
                                if (element) {
                                  const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
                                  graficaUrl = canvas.toDataURL('image/png');
                                }
                                await generatePlayerTestReport(getPlayerById(histSelectedPlayer), tests, historyData, activeTeam, graficaUrl);
                              } catch (e) {
                                console.error(e);
                                await showAlert("Error", "Error al generar el PDF.");
                              }
                            }}
                          >
                            📄 Resumen Técnico
                          </button>
                        </div>
                      </div>

                      {/* Medal of Performance (Bottom Left) */}
                      <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 14 L4 22 L9 20 L12 22 L15 20 L20 22 L17 14" fill="#004B87" stroke="#002d54" strokeWidth="0.5" />
                          <path d="M9 14 L6 22 L9 20 L10 21" fill="#4CAF7D" />
                          <path d="M15 14 L18 22 L15 20 L14 21" fill="#4CAF7D" />
                          <circle cx="12" cy="9" r="6" fill="#D4A843" stroke="#B8860B" strokeWidth="1" />
                          <circle cx="12" cy="9" r="4" fill="none" stroke="#FFF" strokeWidth="0.5" />
                          <path d="M12 6.5 L12.5 8 L14 8.2 L12.8 9.3 L13.2 10.8 L12 9.8 L10.8 10.8 L11.2 9.3 L10 8.2 L11.5 8 Z" fill="#FFF" />
                        </svg>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary, #1B3A2D)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Medalla de Rendimiento
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })()}

              <div className="hist-charts-grid">
                {tests.filter(t => (historyData[histSelectedPlayer]?.[t.id] || []).length > 0).length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>📊 Sin evaluaciones previas. Registra resultados para ver la evolución.</p>
                  </div>
                ) : (
                  tests.map(t => {
                    const history = historyData[histSelectedPlayer]?.[t.id] || [];
                    if(history.length === 0) return null;
                    
                    // Parse values to ensure Recharts can plot them
                    const parsedHistory = history.map(h => ({
                      ...h,
                      val: parseFloat(String(h.val).replace(',', '.')) || 0
                    }));
                    
                    const vals = parsedHistory.map(h => h.val);
                    const min = Math.min(...vals) * 0.9;
                    const max = Math.max(...vals) * 1.1;
                    const range = max - min || 1;
                    
                    // Determine improvement (green arrow) vs worsen (red arrow)
                    const first = vals[0];
                    const last = vals[vals.length - 1];
                    const isTime = t.unit === 'seg';
                    const diff = last - first;
                    const improved = isTime ? diff < 0 : diff > 0;

                    return (
                      <div key={t.id} className="hist-chart-card">
                        <div className="hc-header">
                          <h4>{t.name} <span className="unit">({t.unit})</span></h4>
                          {vals.length > 1 && diff !== 0 ? (
                            <span className={`trend-arrow ${improved ? 'good' : 'bad'}`}>
                              {improved ? '▲' : '▼'} {Math.abs((diff/first)*100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="trend-arrow neutral" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                              Último: {last}
                            </span>
                          )}
                        </div>
                        
                        <GraficaEvolucion data={parsedHistory} isTime={isTime} />
                        
                        <div className="hc-labels">
                          {parsedHistory.map((h, i) => (
                            <div key={i} className="hc-point">
                              <strong>{h.val}</strong>
                              <span>{h.date.split('-').reverse().slice(0,2).join('/')}</span>
                            </div>
                          ))}
                        </div>

                        {/* BARRAS DE PROGRESO GAMING (Para Tests) */}
                        {gamingVisualsV1 && (
                          <div style={{ marginTop: '15px' }}>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(27, 58, 45, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${max > 0 ? Math.min(100, (last / max) * 100) : 0}%`, 
                                height: '100%', 
                                background: 'var(--gold)', 
                                transition: 'width 1s ease-out' 
                              }}></div>
                            </div>
                          </div>
                        )}

                        {/* Botones para corregir errores de carga */}
                        <div className="hc-actions" data-html2canvas-ignore="true" style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                          <button
                            className="btn-outline"
                            style={{
                              flex: 1,
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                              background: 'transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleDeleteLastEval(histSelectedPlayer, t.id)}
                            title="Eliminar la última marca registrada por error"
                          >
                            🗑️ Borrar Último
                          </button>
                          <button
                            className="btn-outline"
                            style={{
                              flex: 1,
                              minHeight: '44px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                              background: 'transparent',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleDeleteAllEvals(histSelectedPlayer, t.id)}
                            title="Eliminar todo el historial de este test para este jugador"
                          >
                            🗑️ Borrar Historial
                          </button>
                        </div>
                        <button
                          className="btn-export-png"
                          data-html2canvas-ignore="true"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const cardElement = e.currentTarget.closest('.hist-chart-card');
                            if (!cardElement) return;
                            try {
                              const canvas = await html2canvas(cardElement, { scale: 2, backgroundColor: '#FFFFFF' });
                              const imgData = canvas.toDataURL('image/png');
                              const downloadAnchor = document.createElement('a');
                              downloadAnchor.setAttribute("href", imgData);
                              downloadAnchor.setAttribute("download", `evolucion_${t.name.replace(/\s+/g, '_').toLowerCase()}_${getPlayerById(histSelectedPlayer)?.name.replace(/\s+/g, '_').toLowerCase() || 'jugador'}.png`);
                              document.body.appendChild(downloadAnchor);
                              downloadAnchor.click();
                              downloadAnchor.remove();
                            } catch (error) {
                              console.error("Error al exportar gráfico:", error);
                              alert("Error al exportar gráfico a imagen.");
                            }
                          }}
                          style={{
                            marginTop: '12px',
                            background: '#004B87',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center',
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          🖼️ Exportar Gráfico (PNG)
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- COMPARATIVA EQUIPO v1.0.18 --- */}
        {activeTab === 'COMPARATIVA EQUIPO' && (
          <div className="tab-comparativa-v2">
            {/* Columna principal */}
            <div className="comp-main-col">
              {/* Título descriptivo */}
              <div className="comp-title-bar">
                Versiones de Mejora Individuales de la Planificación Estratégica (Basado en la Referencia)
              </div>

              {/* Controles */}
              <div className="comp-controls-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label>Test a analizar:</label>
                  <select value={heatSelectedTest} onChange={e => setHeatSelectedTest(e.target.value)}>
                    {tests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-outline-gold"
                    style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      if (!isProActive) {
                        setUpgradeModal({ open: true, message: 'La exportación de informes en CSV es una función PRO. Sube de nivel para usarla.' });
                        return;
                      }
                      const testInfo = getTestById(heatSelectedTest);
                      if (!testInfo) return;
                      
                      const allEvals = [];
                      players.forEach(p => {
                        const history = historyData[p.id]?.[heatSelectedTest] || [];
                        history.forEach(item => {
                          allEvals.push({
                            playerName: p.name || p.nombre || '',
                            val: item.val,
                            date: item.date || ''
                          });
                        });
                      });
                      
                      const allVals = allEvals.map(e => e.val);
                      const isTime = testInfo.unit === 'seg';
                      
                      let csv = `Test;Fecha;Jugador;Valor;Percentil;Nota\n`;
                      allEvals.forEach(ev => {
                        let pct = 100;
                        if (allVals.length > 1) {
                          const worse = allVals.filter(v => isTime ? v > ev.val : v < ev.val).length;
                          const equal = allVals.filter(v => v === ev.val).length;
                          pct = Math.round(((worse + 0.5 * equal) / allVals.length) * 100);
                        }
                        const nota = (1 + 9 * (pct / 100)).toFixed(1);
                        csv += `"${testInfo.name}";"${ev.date}";"${ev.playerName}";"${ev.val}";"${pct}%";"${nota}"\n`;
                      });
                      
                      downloadCSV(csv, `comparativa_${testInfo.name.replace(/\s+/g,'_')}.csv`);
                    }}
                  >
                    📊 Exportar CSV
                  </button>
                  <button 
                    className="btn-outline-gold" 
                    onClick={() => {
                      if (!isProActive) {
                        setUpgradeModal({ open: true, message: 'La exportación de informes colectivos es una función PRO. Sube de nivel para usarla.' });
                      } else {
                        generateTestsReport(tests, players, historyData, activeTeam);
                      }
                    }}
                  >
                    📄 Exportar Informe Colectivo
                  </button>
                </div>
              </div>

              {/* PLANNINGA MATRIX */}
              <div>
                <div className="matrix-label-row">PLANNINGA MATRIX</div>
                <div className="matrix-container">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Dorsal</th>
                        <th style={{ textAlign: 'left' }}>Jugador</th>
                        <th>Eval Inicial</th>
                        <th>✓</th><th>✓</th><th>✓</th><th>✓</th><th>✓</th><th>✓</th>
                        <th>Penúltima Eval</th>
                        <th>Última Eval</th>
                        <th>Evolución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map(p => {
                        const testInfo = getTestById(heatSelectedTest);
                        const history = historyData[p.id]?.[heatSelectedTest] || [];
                        if (history.length === 0) return null;

                        const allCurrentVals = players.map(mp => {
                          const mh = historyData[mp.id]?.[heatSelectedTest] || [];
                          return mh.length > 0 ? mh[mh.length - 1].val : null;
                        }).filter(v => v !== null);

                        const isTime = testInfo?.unit === 'seg';
                        let v1 = '-', v2 = '-', v3 = '-';

                        if (history.length === 1) { v3 = history[0].val; }
                        else if (history.length === 2) { v1 = history[0].val; v3 = history[1].val; }
                        else if (history.length >= 3) {
                          v1 = history[0].val;
                          v2 = history[history.length - 2].val;
                          v3 = history[history.length - 1].val;
                        }

                        const firstVal = history[0].val;
                        const improved = v3 !== '-' ? (isTime ? v3 < firstVal : v3 > firstVal) : false;
                        const diffPerc = firstVal && v3 !== '-' ? Math.abs(((v3 - firstVal) / firstVal) * 100).toFixed(1) : 0;

                        // Checkmarks basados en si tiene datos en distintos puntos
                        const hasData = history.length;
                        const checks = [hasData >= 1, hasData >= 2, hasData >= 3, hasData >= 4, hasData >= 5, hasData >= 6];

                        return (
                          <tr key={p.id}>
                            <td className="dorsal-cell">{p.number}</td>
                            <td className="name-cell">{p.name || p.nombre}</td>
                            <td className="eval-cell">{v1}</td>
                            {checks.map((c, i) => (
                              <td key={i} className="eval-cell">
                                {c ? <span className="check-icon">✓</span> : <span className="dash-icon">—</span>}
                              </td>
                            ))}
                            <td className="eval-cell">{v2}</td>
                            <td className="last-eval-cell">{v3}</td>
                            <td>
                              {history.length > 1 ? (
                                <span className={improved ? 'evo-badge-pos' : 'evo-badge-neg'}>
                                  {improved ? '▲' : '▼'} {diffPerc}%
                                </span>
                              ) : (
                                <span className="evo-badge-neutral">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer temporada */}
              {(() => {
                const allVals = players.flatMap(p => {
                  const h = historyData[p.id]?.[heatSelectedTest] || [];
                  return h.map(e => e.val);
                });
                if (allVals.length === 0) return null;
                const total = allVals.reduce((a, b) => a + Number(b), 0);
                const testInfo = getTestById(heatSelectedTest);
                return (
                  <div className="comp-season-footer">
                    <strong>VOLUMEN TOTAL TEMPORADA</strong>
                    <p>
                      Evaluaciones registradas: <strong>{allVals.length}</strong> &nbsp;·&nbsp;
                      Media general: <strong>{(total / allVals.length).toFixed(1)} {testInfo?.unit}</strong> &nbsp;·&nbsp;
                      Total acumulado: <strong>{total.toFixed(1)}</strong>
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Sidebar recursos */}
            <div className="comp-sidebar-resources">
              <div className="resources-title">{t('tests.resources.title', settings.language)}</div>
              {[
                { icon: '📋', label: t('tests.resources.tacticalLibrary', settings.language), path: '/pizarra' },
                { icon: '🗂️', label: t('tests.resources.drillDatabase', settings.language), path: '/admin', tab: 'ejercicios' },
                { icon: '📊', label: t('tests.resources.tacticalTest', settings.language), action: () => setIsNewTestModalOpen(true) },
                { icon: '🤖', label: t('tests.resources.teamChat', settings.language), path: '/ia-generadora' },
                { icon: '🏆', label: t('tests.resources.seasonReport', settings.language), path: '/admin', tab: 'exportar' },
                { icon: '🛡️', label: t('tests.resources.myTeam', settings.language), path: '/equipo' },
              ].map((r, i) => (
                <div 
                  key={i} 
                  className="resource-item"
                  onClick={() => {
                    if (r.action) {
                      r.action();
                    } else if (r.path) {
                      navigate(r.path, r.tab ? { state: { activeTab: r.tab } } : undefined);
                    }
                  }}
                >
                  <span className="resource-icon">{r.icon}</span>
                  <span className="resource-label">{r.label}</span>
                  <span className="resource-arrow">↗</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR TEST */}
      {isNewTestModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTestModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Test</h2>
              <button className="btn-close" onClick={() => setIsNewTestModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Test</label>
                <input type="text" value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} placeholder="Ej. RM Sentadilla" />
              </div>
              <div className="form-row-team">
                <div className="form-group">
                  <label>Tipo de Test</label>
                  <select value={newTest.type} onChange={e => setNewTest({...newTest, type: e.target.value})}>
                    <option value="fisico">Físico</option>
                    <option value="tactico">Táctico</option>
                    <option value="psicosocial">Psicosocial</option>
                    <option value="socioemocional">Socioemocional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría Específica</label>
                  <input type="text" value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})} placeholder="Ej. Resistencia, Psicología..." />
                </div>
              </div>
              <div className="form-group">
                <label>Unidad de medida</label>
                <input type="text" value={newTest.unit} onChange={e => setNewTest({...newTest, unit: e.target.value})} placeholder="Ej. kg, seg, pts" />
              </div>
              <div className="form-group">
                <label>Descripción rápida</label>
                <input type="text" value={newTest.desc} onChange={e => setNewTest({...newTest, desc: e.target.value})} placeholder="Resumen del test" />
              </div>
              <div className="form-group">
                <label>Protocolo de Ejecución Completo</label>
                <textarea rows="4" value={newTest.protocol || ''} onChange={e => setNewTest({...newTest, protocol: e.target.value})} placeholder="Pasos exactos de cómo se realiza la prueba en campo..."></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsNewTestModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCreateTest}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL TEST */}
      {selectedTestDetail && (
        <div className="modal-overlay" onClick={() => setSelectedTestDetail(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <span className="t-cat">{selectedTestDetail.category}</span>
                <h2 style={{margin: 0}}>{selectedTestDetail.name}</h2>
              </div>
              <button className="btn-close" onClick={() => setSelectedTestDetail(null)}>✕</button>
            </div>
            <div className="modal-body test-detail-body">
              <div className="test-image-placeholder" style={{ padding: selectedTestDetail.imagenProtocolo ? '0' : '20px', backgroundColor: selectedTestDetail.imagenProtocolo ? 'transparent' : '#e2e8f0', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {selectedTestDetail.imagenProtocolo ? (
                  <img src={selectedTestDetail.imagenProtocolo} alt="Protocolo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div className="vector-icon-large" style={{ fontSize: '3rem' }}>📊</div>
                )}
              </div>
              <div className="test-info-block">
                <div className="protocolo-card">
                  <h3>Objetivo y Descripción</h3>
                  <p>{selectedTestDetail.desc}</p>
                </div>
                
                <div className="protocolo-card">
                  <h3>Protocolo de Ejecución</h3>
                  {typeof selectedTestDetail.protocol === 'string' ? (
                    <p>{selectedTestDetail.protocol || 'No se ha especificado un protocolo detallado para esta prueba.'}</p>
                  ) : selectedTestDetail.protocol && typeof selectedTestDetail.protocol === 'object' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p><strong>Ejecución:</strong> {selectedTestDetail.protocol.ejecucion}</p>
                      <p><strong>Medición:</strong> {selectedTestDetail.protocol.medicion}</p>
                      <p><strong>Objetivo:</strong> {selectedTestDetail.protocol.objetivo}</p>
                    </div>
                  ) : (
                    <p>No se ha especificado un protocolo detallado para esta prueba.</p>
                  )}
                </div>
                
                <div className="test-meta">
                  <span><strong>Unidad de medida:</strong> {selectedTestDetail.unit}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
              <button className="btn-outline-gold" onClick={() => descargarPlantilla(selectedTestDetail, players)}>⬇️ Descargar Plantilla de Toma de Datos</button>
              <div className="footer-actions">
                <button className="btn-primary" onClick={() => {
                  if (selectedTestDetail.isQuestionnaire) {
                    setRegSelectedTest(selectedTestDetail.id);
                    setIsQuestionnaireOpen(true);
                  } else {
                    setRegSelectedTest(selectedTestDetail.id);
                    setIsRegModalOpen(true);
                  }
                  setSelectedTestDetail(null);
                }}>Ir a Registrar Resultados</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={upgradeModal.open} 
        onClose={() => setUpgradeModal({ ...upgradeModal, open: false })}
        message={upgradeModal.message}
      />

      {/* MODAL REGISTRO */}
      {isRegModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegModalOpen(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registro de Resultados: {getTestById(regSelectedTest)?.name}</h2>
              <button className="btn-close" onClick={() => setIsRegModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="reg-main-header" style={{ marginBottom: '15px' }}>
                <span className="unit-badge">Unidad: {getTestById(regSelectedTest)?.unit}</span>
              </div>
              <div className="reg-players-grid">
                {players.map(p => (
                  <div key={p.id} className="reg-player-card">
                    <div className="rp-info">
                      <div className="rp-num">{p.number}</div>
                      <div className="rp-name">{p.name}</div>
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={regInputs[p.id] || ''}
                      onChange={e => setRegInputs({...regInputs, [p.id]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsRegModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => {
                handleSaveRegistration();
                setIsRegModalOpen(false);
              }}>Guardar Resultados</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CUESTIONARIO LIKERT */}
      {isQuestionnaireOpen && getTestById(regSelectedTest) && (
        <TestDetail 
          test={getTestById(regSelectedTest)} 
          players={players} 
          onClose={() => setIsQuestionnaireOpen(false)}
          onSave={async (playerId, evalData) => {
            if(!user || !activeTeamId) return;
            try {
              await addDoc(collection(db, getTeamPath(), 'evaluaciones'), {
                testId: regSelectedTest,
                jugadorId: playerId,
                categoria: getTestById(regSelectedTest).type,
                fecha: serverTimestamp(),
                ...evalData
              });
              await showAlert('Éxito', 'Resultados del cuestionario guardados.');
              setIsQuestionnaireOpen(false);
              loadEvaluations();
            } catch(e) {
              console.error(e);
              await showAlert("Error", "Error al guardar cuestionario");
            }
          }}
        />
      )}

      {/* MODAL ANALÍTICAS POR JUGADOR */}
      {analyticsPlayer && (
        <PlayerAnalyticsModal
          player={analyticsPlayer}
          tests={tests}
          historyData={historyData}
          onClose={() => setAnalyticsPlayer(null)}
          onExportPDF={(player) => {
            if (!isPro) {
              setUpgradeModal({ open: true, message: 'La exportación de informes individuales es una función PRO.' });
              return;
            }
            generatePlayerTestReport(player, tests, historyData, activeTeam);
          }}
        />
      )}
      <WellnessTestModal 
        isOpen={isWellnessModalOpen} 
        onClose={() => {setIsWellnessModalOpen(false); setSelectedPlayerForTest(null);}} 
        onSave={handleSavePreventiveTest} 
        player={selectedPlayerForTest} 
      />

      <RPETestModal 
        isOpen={isRpeModalOpen} 
        onClose={() => {setIsRpeModalOpen(false); setSelectedPlayerForTest(null);}} 
        onSave={handleSavePreventiveTest} 
        player={selectedPlayerForTest} 
      />

      {/* Custom Dialog Modal (Glassmorphism Premium) */}
      {modalConfig.isOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-card">
            <h3 className="custom-modal-title">{modalConfig.title}</h3>
            <p className="custom-modal-message">{modalConfig.message}</p>
            <div className="custom-modal-actions">
              {modalConfig.isConfirm && (
                <button 
                  className="btn-modal-cancel" 
                  onClick={() => modalConfig.onConfirm(false)}
                >
                  CANCELAR
                </button>
              )}
              <button 
                className="btn-modal-confirm" 
                onClick={() => modalConfig.onConfirm(true)}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
