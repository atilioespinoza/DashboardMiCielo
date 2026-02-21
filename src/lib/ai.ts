import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export type ReportType = 'executive' | 'commercial' | 'operational' | 'marketing';

const PERSONAS = {
    executive: {
        role: "CEO de Retail experimentado",
        focus: "visión general, salud del negocio, estrategia macro y resultados holísticos."
    },
    commercial: {
        role: "CFO (Director Financiero) experto en Retail",
        focus: "análisis de P&L, márgenes de contribución, estructura de costos fijos vs variables y rentabilidad neta."
    },
    operational: {
        role: "Director de Operaciones (COO) experto en Logística e Inventarios",
        focus: "salud de stock, quiebres de inventario (stockouts), análisis de Pareto, eficiencia en el cumplimiento de pedidos y rotación de productos."
    },
    marketing: {
        role: "CMO (Director de Marketing) experto en Growth y E-commerce",
        focus: "fuentes de tráfico, conversión, retención de clientes, valor del tiempo de vida del cliente (LTV) y estrategias de adquisición."
    }
};

export async function generateSpecializedReport(
    type: ReportType,
    data: any,
    pillarReports?: { commercial?: string, operational?: string, marketing?: string }
) {
    const persona = PERSONAS[type];

    let contextString = "";
    if (type === 'executive' && pillarReports && Object.keys(pillarReports).length > 0) {
        contextString = `
    ESTOS SON LOS ÚLTIMOS REPORTES DE TUS DIRECTORES DE ÁREA:
    
    1. REPORTE CFO (FINANZAS):
    ${pillarReports.commercial || "No disponible"}
    
    2. REPORTE COO (OPERACIONES):
    ${pillarReports.operational || "No disponible"}
    
    3. REPORTE CMO (MARKETING):
    ${pillarReports.marketing || "No disponible"}
    
    Tu tarea es sintetizar estos reportes junto con los datos crudos del dashboard para dar una visión de helicóptero única.
    `;
    }

    const prompt = `
    Actúa como un ${persona.role} con más de 20 años de experiencia transformando e-commerce y tiendas de retail.
    Analiza los siguientes datos específicos del área de ${type === 'commercial' ? 'Estado de Resultados y Finanzas' : type === 'operational' ? 'Operaciones e Inventario' : type === 'marketing' ? 'Marketing y Tráfico' : 'Gestión Ejecutiva'} para el negocio "Mi Cielo".

    ${contextString}

    DATOS CRUDOS DEL DASHBOARD PARA ANÁLISIS:
    ${JSON.stringify(data, null, 2)}

    TU MISIÓN ES GENERAR UN INFORME DE NIVEL EXPERTO CON FOCO EN ${persona.focus.toUpperCase()}.
    
    SI ERES EL CEO: Sintetiza los reportes de tus directores. No repitas lo que ellos dijeron, sino que conecta los puntos (ej. cómo el marketing está afectando el flujo de caja o cómo los quiebres de stock están limitando el LTV).

    EL INFORME DEBE INCLUIR:
    1. **Diagnóstico del Área**: Resumen técnico de la situación actual.
    2. **Métricas Clave e Insights**: Identifica 3 hallazgos críticos basados puramente en los datos proporcionados.
    3. **Estrategias y Accionables**: Propón 3 acciones concretas y numéricas para mejorar los resultados.
    4. **Plan de Tareas Detallado**:
       - Tareas de Corto Plazo (Ejecución la próxima semana): Lista de 3 tareas.
       - Tareas de Mediano Plazo (Próximos 3 meses): Lista de 2 objetivos estratégicos.
    5. **Impacto Esperado**: Qué resultado esperas ver en el P&L si se ejecutan estas tareas.

    Tono: Profesional, directo, basado en datos (Data-Driven) y orientado a la rentabilidad. 
    Idioma: Español.
    Formato: Markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error(`ERROR in generateSpecializedReport [${type}]:`, error);

        // Revelar más detalles si es un error de seguridad o de la API
        if (error.response && error.response.promptFeedback) {
            console.error("Prompt Feedback:", error.response.promptFeedback);
        }

        throw new Error("No se pudo generar el informe especializado en este momento.");
    }
}
