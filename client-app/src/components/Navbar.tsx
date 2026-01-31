import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ClockCircleOutlined,
  DownOutlined,
  FileTextOutlined,
  HomeOutlined,
  PlusCircleOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import Logo96 from "../assets/button.png"; 
import type { GameType } from "./Player/types";
import { generateScoutingReport } from "../api/simulation";
import { useState } from "react";

const Navbar = ({ teams }: { teams: GameType[] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { team_id, game_id, series_id } = useParams();
  const team = teams.find((team) => team.team_id.toString() === team_id);
  const [loading, setLoading] = useState(false);

  const navItems = [
    { label: "Dashboard", path: `/${game_id}/team/${team_id}`, icon: <HomeOutlined /> },
    { label: "TimeLine", path: `/${game_id}/team/${team_id}/timeline`, icon: <ClockCircleOutlined /> },
    { label: "Simulate", path: `/${game_id}/team/${team_id}/simulate`, icon: <SlidersOutlined /> },
  ];

  const items: MenuProps["items"] = [
    ...teams.map((team) => ({
      label: team.team_name,
      key: team.team_id       
    })),
    {
      type: "divider",
    },
    {
      key: "add-team",
      label: "Add Team",
      onClick: () => navigate("/add-team"),
      icon: <PlusCircleOutlined />,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(`/dashboard/${e.key}`)
  };

  const scoutingHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
     generateScoutingReport(team_id ?? '', series_id ?? '')
     .then((res) => {
       console.log("Res", res.pdf_url);
       setLoading(false);
      window.open(res.pdf_url, '_blank');
     })
     .catch((err) => {
       setLoading(false);
      console.log("err",err)
     })
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              <img
                // width="96"
                // height="96"
                className="w-12 h-12"
                src={Logo96}
                alt="medium-icons"
              />
            </span>
          </div>

          {/* <div className="flex bg-white p-2  gap-1"> */}
          <div className="flex p-1.5 gap-2 w-max">
            {navItems.map((item) => {
              // Check if current browser path matches the item path
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  icon={item.icon}
                  // 1. Change the path on click
                  onClick={() => navigate(item.path)}
                  // 2. Dynamic styling based on isActive
                  style={{
                    backgroundColor: isActive ? "#333333" : "transparent",
                    color: isActive ? "white" : "gray",
                  }}
                  className={`
              h-10 px-5 border-none rounded-xl font-medium shadow-sm transition-all flex items-center
              ${
                isActive
                  ? "bg-[#262626] text-white shadow-md hover:!bg-[#333] hover:!text-white"
                  : "text-gray-500 bg-transparent hover:bg-gray-100"
              }
            `}
                >
                  {item.label}
                </Button>
              );
            })}
            <Button
                  // key={item.path}
                  icon={<FileTextOutlined />}
                  // 1. Change the path on click
                  onClick={scoutingHandler}
                  // 2. Dynamic styling based on isActive
                  style={{
                    backgroundColor: "transparent",
                    color:  "gray",
                  }}
                  className={`
              h-10 px-5 border-none rounded-xl font-medium shadow-sm transition-all flex items-center
              text-gray-500 bg-transparent hover:bg-gray-100              
            `}
                >
                               {loading ? 'Generating...' : 'Scouting Report'}
                </Button>
          </div>

          <div className="flex items-center space-x-2">
        
                   
            <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button> 

            <Dropdown menu={menuProps}>
              <Button
                size="middle"
                className="h-16 px-4 flex items-center gap-3 rounded-lg border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-md font-medium text-gray-800">
                      {team?.team_name}
                    </span>
                  </div>
                </div>
                <DownOutlined className="text-gray-400 ml-2" />
              </Button>
            </Dropdown>

            <div className="relative flex items-center">
              <button className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition-all">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User avatar"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
