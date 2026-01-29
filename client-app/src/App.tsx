import React, { useEffect, useState } from "react";
import { Breadcrumb, Layout } from "antd";
import Dashboard from "./components/Dashboard/Dashboard";
import { useNavigate, useLocation, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import AddTeam from "./components/AddTeam";
import Timeline from "./components/Timeline/Timeline";
import SeriesBase from "./components/Series/SeriesBase";
import PlayerRoundBase from "./components/Player/PlayerRoundBase";
const { Header, Content, Footer } = Layout;
import Cookies from 'js-cookie';
import { generateUserId } from "./api/user";
import { type GameType, getMyTeams } from "./api/team";
 

const App: React.FC = () => {

  const [teams, setTeams] = React.useState<GameType[]>([])

  const navigate = useNavigate();

  const {game_id, team_id, series_id} = useParams();

useEffect(() => {
  if (Cookies.get("grid_user_id") === undefined) {
    generateUserId();
  }

  getMyTeams(Cookies.get("grid_user_id") || "")
    .then((data) => {
      setTeams(data);

      // redirect only if empty
      if (data.length === 0) {
        // avoid infinite redirect if already in add-team
        if (location.pathname !== "/add-team") {
          navigate("/add-team", { replace: true });
        }
      }

      // else: do nothing -> follow normal routes
    })
    .catch((error) => {
      console.error("Error fetching my teams:", error);
    });
}, []);

const location = useLocation();
const pathnames = location.pathname.split('/').filter((x) => x);
 
 const generateBreadcrumbItems = (pathnames) => {
  const items = [
    {
      title: 'Home',
      href: `/${game_id}/team/${team_id}`
    },
  ];

  if (pathnames[0] === 'timeline') {
    items.push({
      title: 'Series Timeline',
      href: `/${game_id}/team/${team_id}/timeline`,
    });
  } else if (pathnames.includes('series')) {
    const seriesIndex = pathnames.indexOf('series');
    const seriesId = pathnames[seriesIndex + 1];
    items.push({
      title: `Series (#${seriesId})`,
      href: `/${game_id}/team/${team_id}/series/${seriesId}`
    });

    if (pathnames.includes('round')) {
      const roundIndex = pathnames.indexOf('round');
      const roundId = pathnames[roundIndex + 1];
      items.push({
        title: `Round ${roundId}`,
        href: `/${game_id}/team/${team_id}/series/${series_id}/round/${roundId}`,
      });
    }
  }

  return items;
};

const breadcrumbItems = generateBreadcrumbItems(pathnames);
 
  return (
   <Routes>
      <Route path="/add-team" element={<AddTeam />} />

      <Route
        element={
          <AppLayout teams={teams} breadcrumbItems={breadcrumbItems} />
        }
      >
        <Route path="/:game_id/team/:team_id" element={<Dashboard />} />
        <Route path="/:game_id/team/:team_id/series/:series_id" element={<SeriesBase />} />
        <Route path="/:game_id/team/:team_id/series/:series_id/round/:round_id" element={<PlayerRoundBase />} />
        <Route path="/:game_id/team/:team_id/timeline" element={<Timeline />} />

      </Route>
    </Routes>
  );  
};

export default App;

function AppLayout({ teams, breadcrumbItems }: { teams: GameType[], breadcrumbItems: {
    title: string;
    href: string;
}[] }) {
  return (
    <Layout className="h-screen flex flex-col bg-neutral-100">
      <Navbar teams={teams} />

      <Content className="flex-1 flex flex-col px-10 py-4 bg-white">
        <Breadcrumb className="p-5" items={breadcrumbItems} />
        <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
          {/* ✅ This renders the child routes */}
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
