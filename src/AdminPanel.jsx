import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export default function AdminPanel() {
  const [profiles, setProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [editingUserId, setEditingUserId] = useState(null)
  const [formData, setFormData] = useState({ plan: "", appeal_quota: "" })

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("*")
      if (error) {
        console.error("Error fetching profiles:", error.message)
      } else {
        setProfiles(data)
      }
    }

    fetchProfiles()
  }, [])

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlan = planFilter ? profile.plan === planFilter : true

    return matchesSearch && matchesPlan
  })

  const handleEditClick = (profile) => {
    setEditingUserId(profile.id)
    setFormData({ plan: profile.plan, appeal_quota: profile.appeal_quota })
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", editingUserId)

    if (error) {
      alert("Update failed: " + error.message)
    } else {
      const updated = profiles.map((p) =>
        p.id === editingUserId ? { ...p, ...formData } : p
      )
      setProfiles(updated)
      setEditingUserId(null)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">User ID</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Plan</th>
            <th className="text-left p-2">Quota</th>
            <th className="text-left p-2">Trial Ends</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProfiles.map((profile) => (
            <tr key={profile.id} className="border-b hover:bg-gray-50">
              <td className="p-2 text-sm">{profile.id}</td>
              <td className="p-2">{profile.name}</td>
              <td className="p-2">
                {editingUserId === profile.id ? (
                  <select
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({ ...formData, plan: e.target.value })
                    }
                    className="border p-1 rounded"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                ) : (
                  profile.plan
                )}
              </td>
              <td className="p-2">
                {editingUserId === profile.id ? (
                  <input
                    type="number"
                    value={formData.appeal_quota}
                    onChange={(e) =>
                      setFormData({ ...formData, appeal_quota: parseInt(e.target.value) })
                    }
                    className="border p-1 rounded w-20"
                  />
                ) : (
                  profile.appeal_quota
                )}
              </td>
              <td className="p-2">
                {new Date(profile.trial_end_date).toLocaleDateString()}
              </td>
              <td className="p-2">
                {editingUserId === profile.id ? (
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:underline mr-2"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEditClick(profile)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
