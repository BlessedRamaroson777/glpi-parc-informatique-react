import { TICKET_STATUS } from "../../common/constants/TicketConstants"
import { useEffect, useState } from "react"

// const STATUS_OPTIONS = [
//     { key: "status1", label: "Nouveau" },
//     { key: "status2", label: "En cours attribue" },
//     { key: "status5", label: "Resolu" },
// ]

export default function ParametreKanbanColorsCard({
    colors,
    saving,
    message,
    onColorChange,
    onSave,
    onReset,
}) {
    
    // async function loadKanbanColors() {
    //         console.log("haaa",colors);
    //     console.log(TICKET_STATUS)
    // }
    function handleChangeColor(e, option) {
        onColorChange(option, e.target.value);
        // console.log(option)
        // console.log(TICKET_STATUS)
    }

    // useEffect(() => {
    //         loadKanbanColors()
    // }, [])
    return (
        <div className="card">
            <h2>Couleurs Kanban</h2>
            <form className="card-form card-form-column" onSubmit={onSave}>
                <div className="kanban-colors-grid">
                    {TICKET_STATUS.map(option => (
                        <label key={"status"+option.value} className="color-field">
                            <span>{option.label}</span>
                            <input
                                type="color"
                                value={colors["status"+option.value]}
                                onChange={(e) => handleChangeColor(e, "status" + option.value)}
                            />
                            <small>{colors["status"+option.value]}</small>
                        </label>
                    ))}
                </div>
                <div className="actions">
                    <button type="submit" disabled={saving}>
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={onReset} disabled={saving}>
                        Reinitialiser
                    </button>
                </div>
            </form>
            {message && <p className="status-msg">{message}</p>}
        </div>
    )
}
