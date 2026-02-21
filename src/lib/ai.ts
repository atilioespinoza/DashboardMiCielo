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

export async function generateSpecializedReport(type: ReportType, data: any) {
    const persona = PERSONAS[type];

    const prompt = `
    Actúa como un ${persona.role} con más de 20 años de experiencia transformando e-commerce y tiendas de retail.
    Analiza los siguientes datos específicos del área de ${type === 'commercial' ? 'Estado de Resultados y Finanzas' : type === 'operational' ? 'Operaciones e Inventario' : type === 'marketing' ? 'Marketing y Tráfico' : 'Gestión Ejecutiva'} para el negocio "Mi Cielo".

    DATOS PARA ANÁLISIS:
    ${JSON.stringify(data, null, 2)}

    TU MISIÓN ES GENERAR UN INFORME DE NIVEL EXPERTO CON FOCO EN ${persona.focus.toUpperCase()}.

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
        return result.response.text();
    } catch (error) {
        console.error(`Error generating ${type} report:`, error);
        throw new Error("No se pudo generar el informe especializado en este momento.");
    }
}
