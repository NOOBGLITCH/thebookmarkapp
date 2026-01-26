import { useState } from 'react'

export default function TagInput({ tags, setTags }) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1)
        }
    }

    const addTag = () => {
        const tag = inputValue.trim().toLowerCase()
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag])
            setInputValue('')
        }
    }

    const removeTag = (index) => {
        setTags(tags.filter((_, i) => i !== index))
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 p-3 bg-background border border-gray-700 rounded-lg focus-within:border-accent">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="hover:text-accent/80 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-primaryText"
                />
            </div>
            <p className="text-xs text-secondaryText mt-1">Press Enter or comma to add tags</p>
        </div>
    )
}
