import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using a more stable model or the one they prefer

export async function generateExecutiveReport(data: any) {
    const prompt = `
    Actúa como un experimentado CEO de Retail con más de 20 años de experiencia transformando e-commerce y tiendas físicas.
    Analiza los siguientes datos de rendimiento del negocio "Mi Cielo" (una tienda de retail/e-commerce) y genera un informe de nivel ejecutivo.

    DATOS DEL NEGOCIO:
    ${JSON.stringify(data, null, 2)}

    EL INFORME DEBE INCLUIR:
    1. **Resumen Ejecutivo**: Una visión general de la salud actual del negocio en una frase potente.
    2. **Insights Críticos**: Identifica 3 hallazgos clave basados en los datos (ventas, márgenes, canales, retención, etc.).
    3. **Accionables Claros**: Propón 3 estrategias inmediatas para mejorar el rendimiento.
    4. **Plan de Acción**:
       - Tareas a Corto Plazo (Próxima semana)
       - Tareas a Mediano Plazo (Próximos 3 meses)
    5. **Conclusión**: Un mensaje motivador y visionario para el equipo.

    Tono: Profesional, directo, analítico pero inspirador. 
    Idioma: Español.
    Formato: Markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating executive report:", error);
        throw new Error("No se pudo generar el informe en este momento.");
    }
}
